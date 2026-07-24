import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  deleteStorageFile,
  getSignedViewUrl,
  uploadPrivateFile,
} from "@/lib/storage/supabase";

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "avatars");
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type AvatarStorageMode = "local" | "supabase";

export function getAvatarStorageMode(): AvatarStorageMode {
  // Default local (project /public/uploads). Set AVATAR_STORAGE=supabase when ready.
  return process.env.AVATAR_STORAGE?.trim().toLowerCase() === "supabase" ? "supabase" : "local";
}

function extensionFor(contentType: string) {
  return ALLOWED_TYPES.get(contentType) ?? null;
}

export function validateAvatarFile(file: File) {
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Photo must be 2 MB or smaller." };
  }
  const ext = extensionFor(file.type);
  if (!ext) {
    return { error: "Use a JPG, PNG, WEBP, or GIF image." };
  }
  return { ext };
}

async function deleteLocalAvatar(storedPath: string | null | undefined) {
  if (!storedPath?.startsWith("/uploads/avatars/")) return;
  const absolute = path.join(process.cwd(), "public", storedPath.replace(/^\//, ""));
  if (!absolute.startsWith(LOCAL_UPLOAD_ROOT)) return;
  try {
    await unlink(absolute);
  } catch {
    // Missing file is fine (already removed / never written).
  }
}

async function saveLocalAvatar(candidateId: string, buffer: Buffer, ext: string) {
  await mkdir(LOCAL_UPLOAD_ROOT, { recursive: true });
  const filename = `${candidateId}-${randomUUID().slice(0, 8)}.${ext}`;
  const absolute = path.join(LOCAL_UPLOAD_ROOT, filename);
  await writeFile(absolute, buffer);
  return `/uploads/avatars/${filename}`;
}

async function saveSupabaseAvatar(candidateId: string, buffer: Buffer, contentType: string, ext: string) {
  const objectPath = `${candidateId}/avatar/${randomUUID()}.${ext}`;
  await uploadPrivateFile(objectPath, buffer, contentType, {
    upsert: false,
    cacheControl: "public, max-age=86400",
  });
  return objectPath;
}

export async function storeCandidateAvatar(input: {
  candidateId: string;
  buffer: Buffer;
  contentType: string;
  previousPath?: string | null;
}) {
  const ext = extensionFor(input.contentType);
  if (!ext) throw new Error("Unsupported image type");

  const mode = getAvatarStorageMode();
  const nextPath =
    mode === "supabase"
      ? await saveSupabaseAvatar(input.candidateId, input.buffer, input.contentType, ext)
      : await saveLocalAvatar(input.candidateId, input.buffer, ext);

  if (input.previousPath && input.previousPath !== nextPath) {
    await removeStoredAvatar(input.previousPath).catch(() => undefined);
  }

  return { path: nextPath, mode };
}

export async function removeStoredAvatar(storedPath: string | null | undefined) {
  if (!storedPath) return;
  if (storedPath.startsWith("/uploads/")) {
    await deleteLocalAvatar(storedPath);
    return;
  }
  if (getAvatarStorageMode() === "supabase" || !storedPath.startsWith("/")) {
    await deleteStorageFile(storedPath);
  }
}

/** Resolve a stored avatar path into a browser-usable URL. */
export async function resolveAvatarUrl(storedPath: string | null | undefined): Promise<string | null> {
  if (!storedPath) return null;
  if (storedPath.startsWith("/uploads/") || storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
    return storedPath;
  }
  try {
    return await getSignedViewUrl(storedPath, 60 * 60);
  } catch {
    return null;
  }
}
