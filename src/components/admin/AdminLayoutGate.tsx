"use client";

/** Admin layout always uses the authenticated shell; login lives at `/login`. */
export function AdminLayoutGate({
  children,
  shell,
}: {
  children: React.ReactNode;
  shell: React.ReactNode;
}) {
  return shell ?? children;
}
