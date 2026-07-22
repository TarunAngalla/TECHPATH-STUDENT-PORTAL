import { createHash } from "node:crypto";

function normalizedTemplateSource(input: { title: string; version: string; content: string }) {
  return JSON.stringify({
    title: input.title.normalize("NFKC").trim(),
    version: input.version.normalize("NFKC").trim(),
    content: input.content.normalize("NFKC").replace(/\r\n/g, "\n").trim(),
  });
}

export function hashNdaTemplate(input: { title: string; version: string; content: string }) {
  return createHash("sha256").update(normalizedTemplateSource(input), "utf8").digest("hex");
}
