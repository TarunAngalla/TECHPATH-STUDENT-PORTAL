"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { documentCategories } from "@/lib/db/schema";
import { deleteStorageFile, uploadDocumentFile } from "@/lib/storage/supabase";

const uploadSchema = z.object({
  candidateId: z.string().uuid(),
  name: z.string().min(1),
  category: z.enum(documentCategories as unknown as [string, ...string[]]),
});

export async function uploadDocument(formData: FormData) {
  await requireStaffAuth();
  const file = formData.get("file") as File | null;
  const candidateId = formData.get("candidateId") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;

  const parsed = uploadSchema.safeParse({ candidateId, name, category });
  if (!parsed.success || !file) return { error: "Invalid input" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadDocumentFile(candidateId, file.name, buffer, file.type);

  await db.insert(documents).values({
    candidateId: parsed.data.candidateId,
    name: parsed.data.name,
    category: parsed.data.category as (typeof documentCategories)[number],
    fileUrl,
  });

  revalidatePath("/documents");
  revalidatePath(`/admin/candidates/${parsed.data.candidateId}`);
  return {};
}

export async function deleteDocument(documentId: string, candidateId: string) {
  await requireStaffAuth();
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc) return { error: "Not found" };

  await deleteStorageFile(doc.fileUrl);
  await db.delete(documents).where(eq(documents.id, documentId));

  revalidatePath("/documents");
  revalidatePath(`/admin/candidates/${candidateId}`);
  return {};
}
