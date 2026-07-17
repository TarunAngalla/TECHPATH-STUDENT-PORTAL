import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, key);
}

export async function uploadDocumentFile(
  candidateId: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
) {
  const supabase = getSupabaseAdmin();
  const path = `${candidateId}/${randomUUID()}-${filename}`;

  const { error } = await supabase.storage.from("documents").upload(path, buffer, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("documents").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteStorageFile(fileUrl: string) {
  const supabase = getSupabaseAdmin();
  const url = new URL(fileUrl);
  const parts = url.pathname.split("/documents/");
  if (parts.length < 2) return;
  const path = parts[1];
  await supabase.storage.from("documents").remove([path]);
}

export async function getSignedDownloadUrl(fileUrl: string) {
  const supabase = getSupabaseAdmin();
  const url = new URL(fileUrl);
  const parts = url.pathname.split("/documents/");
  if (parts.length < 2) return fileUrl;
  const path = decodeURIComponent(parts[1]);
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? fileUrl;
}
