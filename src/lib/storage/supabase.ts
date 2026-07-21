import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const DEFAULT_BUCKET = "documents";
function getBucket() { return process.env.SUPABASE_DOCUMENTS_BUCKET ?? DEFAULT_BUCKET; }
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase credentials not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function sanitizeFilename(filename: string) {
  return filename.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "").slice(0, 120) || "document";
}
export function storagePathFromValue(value: string | null | undefined) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");
  try {
    const url = new URL(value);
    const bucket = getBucket();
    const markers = [`/storage/v1/object/public/${bucket}/`, `/storage/v1/object/sign/${bucket}/`];
    const marker = markers.find((item) => url.pathname.includes(item));
    if (!marker) return null;
    return decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
  } catch { return null; }
}
export async function uploadDocumentFile(candidateId: string, filename: string, buffer: Buffer, contentType: string) {
  const path = `${candidateId}/${randomUUID()}-${sanitizeFilename(filename)}`;
  const { error } = await getSupabaseAdmin().storage.from(getBucket()).upload(path, buffer, {
    contentType, upsert: false, cacheControl: "3600",
  });
  if (error) throw new Error(error.message);
  return path;
}
export async function deleteStorageFile(value: string | null | undefined) {
  const path = storagePathFromValue(value);
  if (!path) return;
  const { error } = await getSupabaseAdmin().storage.from(getBucket()).remove([path]);
  if (error) throw new Error(error.message);
}
export async function getSignedDownloadUrl(value: string | null | undefined, expiresInSeconds = 300) {
  const path = storagePathFromValue(value);
  if (!path) throw new Error("Document storage path is invalid");
  const { data, error } = await getSupabaseAdmin().storage.from(getBucket())
    .createSignedUrl(path, expiresInSeconds, { download: true });
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not create download URL");
  return data.signedUrl;
}
