"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidatePortalAccess, requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import { assertCandidateInScope } from "@/lib/db/queries/admin/candidates";
import { documentCategories, documents } from "@/lib/db/schema";
import {
  removeStoredDocument,
  storeCandidateDocument,
} from "@/lib/storage/documents";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png", "image/jpeg",
]);
const uploadSchema = z.object({
  candidateId: z.string().uuid(), name: z.string().trim().min(1).max(160),
  category: z.enum(documentCategories as unknown as [string, ...string[]]),
});
function validateFile(file: File) {
  if (file.size <= 0) return "The selected file is empty.";
  if (file.size > MAX_DOCUMENT_BYTES) return "File size must be under 10MB.";
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) return "Only PDF, DOC, DOCX, PNG, and JPG files are allowed.";
  return null;
}
export async function uploadDocument(formData: FormData) {
  const staff = await requireStaffAuth();
  const file = formData.get("file") as File | null;
  const parsed = uploadSchema.safeParse({
    candidateId: formData.get("candidateId"), name: formData.get("name"), category: formData.get("category"),
  });
  if (!parsed.success || !file) return { error: "Invalid input" };
  if (!(await assertCandidateInScope(parsed.data.candidateId, getStaffScope(staff)))) return { error: "Forbidden" };
  const fileError = validateFile(file); if (fileError) return { error: fileError };
  try {
    const stored = await storeCandidateDocument({
      candidateId: parsed.data.candidateId,
      filename: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
    await db.insert(documents).values({
      candidateId: parsed.data.candidateId, name: parsed.data.name,
      category: parsed.data.category as (typeof documentCategories)[number],
      storagePath: stored.path,
      fileUrl: null,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
  revalidatePath("/resources"); revalidatePath(`/admin/candidates/${parsed.data.candidateId}`); return {};
}
export async function deleteDocument(documentId: string) {
  const staff = await requireStaffAuth();
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc) return { error: "Not found" };
  if (!(await assertCandidateInScope(doc.candidateId, getStaffScope(staff)))) return { error: "Forbidden" };
  await removeStoredDocument(doc.storagePath ?? doc.fileUrl);
  await db.delete(documents).where(eq(documents.id, documentId));
  revalidatePath("/resources"); revalidatePath(`/admin/candidates/${doc.candidateId}`); return {};
}
export async function uploadResumeAsCandidate(formData: FormData) {
  const session = await requireCandidatePortalAccess();
  if (!serverFeatures.candidateResumeUpload) return { error: "Candidate uploads are disabled. Contact your recruiter." };
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };
  const fileError = validateFile(file); if (fileError) return { error: fileError };
  try {
    const stored = await storeCandidateDocument({
      candidateId: session.candidateId!,
      filename: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
    await db.insert(documents).values({
      candidateId: session.candidateId!,
      name: file.name,
      category: "resume",
      storagePath: stored.path,
      fileUrl: null,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
  revalidatePath("/resources"); revalidatePath("/dashboard"); return {};
}
