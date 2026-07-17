import { STATUS_META, type ApplicationStatus } from "@/lib/constants/status-meta";

export function StatusPill({ status }: { status: ApplicationStatus }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}
