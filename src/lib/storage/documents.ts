import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  deleteStorageFile as deleteSupabaseFile,
  getSignedDownloadUrl,
  uploadDocumentFile as uploadSupabaseDocumentFile,
} from "@/lib/storage/supabase";

/** Private on-disk root (not under /public — downloads stay auth-gated). */
const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "uploads", "documents");
const LOCAL_PATH_PREFIX = "local/";

export type DocumentStorageMode = "local" | "supabase";

export function getDocumentStorageMode(): DocumentStorageMode {
  // Default local. Set DOCUMENT_STORAGE=supabase when ready.
  return process.env.DOCUMENT_STORAGE?.trim().toLowerCase() === "supabase"
    ? "supabase"
    : "local";
}

function sanitizeFilename(filename: string) {
  return (
    filename
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 120) || "document"
  );
}

export function isLocalDocumentPath(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith(LOCAL_PATH_PREFIX) || value.startsWith("/uploads/documents/");
}

function localAbsolutePath(storedPath: string) {
  const relative = storedPath
    .replace(new RegExp(`^${LOCAL_PATH_PREFIX}`), "")
    .replace(/^\/uploads\/documents\//, "");
  const absolute = path.resolve(LOCAL_UPLOAD_ROOT, relative);
  if (!absolute.startsWith(LOCAL_UPLOAD_ROOT)) {
    throw new Error("Invalid local document path");
  }
  return absolute;
}

async function saveLocalDocument(
  candidateId: string,
  filename: string,
  buffer: Buffer,
) {
  const dir = path.join(LOCAL_UPLOAD_ROOT, candidateId);
  await mkdir(dir, { recursive: true });
  const safeName = sanitizeFilename(filename);
  const objectName = `${randomUUID().slice(0, 8)}-${safeName}`;
  const absolute = path.join(dir, objectName);
  await writeFile(absolute, buffer);
  return `${LOCAL_PATH_PREFIX}${candidateId}/${objectName}`;
}

async function deleteLocalDocument(storedPath: string) {
  try {
    await unlink(localAbsolutePath(storedPath));
  } catch {
    // Missing file is fine.
  }
}

/** Upload a candidate document to local disk or Supabase based on DOCUMENT_STORAGE. */
export async function storeCandidateDocument(input: {
  candidateId: string;
  filename: string;
  buffer: Buffer;
  contentType: string;
}) {
  const mode = getDocumentStorageMode();
  if (mode === "supabase") {
    const storagePath = await uploadSupabaseDocumentFile(
      input.candidateId,
      input.filename,
      input.buffer,
      input.contentType,
    );
    return { path: storagePath, mode };
  }

  const storagePath = await saveLocalDocument(
    input.candidateId,
    input.filename,
    input.buffer,
  );
  return { path: storagePath, mode };
}

export async function removeStoredDocument(value: string | null | undefined) {
  if (!value) return;
  if (isLocalDocumentPath(value)) {
    await deleteLocalDocument(value);
    return;
  }
  await deleteSupabaseFile(value);
}

function contentTypeForFilename(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

/**
 * Auth-gated download: stream local files, or redirect to a short-lived Supabase URL.
 */
export async function createDocumentDownloadResponse(
  storagePath: string | null | undefined,
  fileUrl: string | null | undefined,
  downloadFileName?: string,
) {
  const value = storagePath ?? fileUrl;
  if (!value) throw new Error("Document storage path is missing");

  if (isLocalDocumentPath(value)) {
    const absolute = localAbsolutePath(value);
    const buffer = await readFile(absolute);
    const filename =
      downloadFileName?.trim() ||
      path.basename(absolute).replace(/^[a-f0-9]{8}-/i, "") ||
      "document";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentTypeForFilename(filename),
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.redirect(await getSignedDownloadUrl(value, 300));
}
