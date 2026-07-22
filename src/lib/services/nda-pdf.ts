import { createHash } from "node:crypto";

export type SignedNdaPdfInput = {
  agreementId: string;
  templateTitle: string;
  templateVersion: string;
  templateContent: string;
  templateHash: string;
  candidateName: string;
  candidateEmail: string;
  signerName: string;
  acceptedAt: Date;
  consentText: string;
  signerIp?: string | null;
  signerUserAgent?: string | null;
  signingProvider: string;
};

type PdfLine = { text: string; size?: number; bold?: boolean; gapAfter?: number };

function safeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

function escapePdfString(value: string) {
  return safeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(value: string, maxCharacters = 92) {
  const paragraphs = safeText(value).replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      output.push("");
      continue;
    }
    let current = words[0];
    for (const word of words.slice(1)) {
      if (`${current} ${word}`.length <= maxCharacters) current += ` ${word}`;
      else {
        output.push(current);
        current = word;
      }
    }
    output.push(current);
  }
  return output;
}

function buildLines(input: SignedNdaPdfInput) {
  const lines: PdfLine[] = [
    { text: input.templateTitle, size: 18, bold: true, gapAfter: 8 },
    { text: `Version ${input.templateVersion}`, size: 10, bold: true, gapAfter: 12 },
  ];
  for (const line of wrap(input.templateContent)) lines.push({ text: line, size: 10.5 });
  lines.push({ text: "", gapAfter: 10 });
  lines.push({ text: "Electronic signature evidence", size: 13, bold: true, gapAfter: 5 });
  const evidence = [
    `Candidate: ${input.candidateName}`,
    `Candidate email: ${input.candidateEmail}`,
    `Typed legal name: ${input.signerName}`,
    `Accepted at: ${input.acceptedAt.toISOString()}`,
    `Consent: ${input.consentText}`,
    `Signing method: ${input.signingProvider}`,
    `IP address: ${input.signerIp || "Not available"}`,
    `User agent: ${input.signerUserAgent || "Not available"}`,
    `NDA template hash (SHA-256): ${input.templateHash}`,
    `Agreement ID: ${input.agreementId}`,
  ];
  for (const item of evidence) {
    for (const line of wrap(item, 88)) lines.push({ text: line, size: 9.5 });
  }
  return lines;
}

function paginate(lines: PdfLine[]) {
  const pages: PdfLine[][] = [[]];
  let used = 0;
  const usableHeight = 670;
  for (const line of lines) {
    const lineHeight = (line.size ?? 10.5) + 4.5 + (line.gapAfter ?? 0);
    if (used + lineHeight > usableHeight && pages[pages.length - 1].length > 0) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(line);
    used += lineHeight;
  }
  return pages;
}

function contentStream(lines: PdfLine[], pageNumber: number, pageCount: number) {
  const commands: string[] = ["BT", "54 738 Td"];
  for (const line of lines) {
    const size = line.size ?? 10.5;
    commands.push(`/${line.bold ? "F2" : "F1"} ${size} Tf`);
    commands.push(`(${escapePdfString(line.text)}) Tj`);
    commands.push(`0 -${size + 4.5 + (line.gapAfter ?? 0)} Td`);
  }
  commands.push("ET");
  commands.push("BT /F1 8 Tf 54 28 Td");
  commands.push(`(TechPath NDA | Page ${pageNumber} of ${pageCount}) Tj ET`);
  return commands.join("\n");
}

function buildPdf(input: SignedNdaPdfInput) {
  const pages = paginate(buildLines(input));
  const objects: string[] = [];
  const add = (value: string) => {
    objects.push(value);
    return objects.length;
  };

  const catalogId = add("");
  const pagesId = add("");
  const regularFontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds: number[] = [];

  pages.forEach((pageLines, index) => {
    const stream = contentStream(pageLines, index + 1, pages.length);
    const streamBytes = Buffer.from(stream, "latin1");
    const contentId = add(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`);
    const pageId = add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> ` +
      `/Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const infoId = add(
    `<< /Title (${escapePdfString(`${input.templateTitle} - ${input.candidateName}`)}) ` +
    `/Author (The TechPath) /Subject (Signed NDA version ${escapePdfString(input.templateVersion)}) >>`,
  );

  let output = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output, "latin1"));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(output, "latin1");
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\n`;
  output += `startxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(output, "latin1");
}

export async function generateSignedNdaPdf(input: SignedNdaPdfInput) {
  const bytes = buildPdf(input);
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}
