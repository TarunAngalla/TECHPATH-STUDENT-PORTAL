import { randomUUID } from "node:crypto";

export function getOrCreateRequestId(headers?: Headers) {
  const supplied = headers?.get("x-request-id")?.trim();
  if (supplied && /^[a-zA-Z0-9._:-]{8,128}$/.test(supplied)) return supplied;
  return randomUUID();
}
