import { desc, eq } from "drizzle-orm";
import { DOCUMENT_SECTIONS } from "@/lib/constants/document-sections";
import { db } from "@/lib/db";
import { documents, type DocumentCategory } from "@/lib/db/schema";

export async function getDocumentsByCandidateId(candidateId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.candidateId, candidateId))
    .orderBy(desc(documents.uploadedAt));
}

export function groupDocumentsBySection(
  docs: Awaited<ReturnType<typeof getDocumentsByCandidateId>>,
  optType: "OPT" | "STEM_OPT",
) {
  return DOCUMENT_SECTIONS.filter((s) => !s.stemOnly || optType === "STEM_OPT").map((section) => ({
    title: section.title,
    documents: docs.filter((d) => section.categories.includes(d.category as DocumentCategory)),
  }));
}
