"use client";

export function SaveConfirmation({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <span role="status" aria-live="polite" className="text-[11px] font-medium text-[#2F8F5B]">
      {message}
    </span>
  );
}
