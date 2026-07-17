import { companyBadge } from "@/lib/utils/company-badge";

export function CompanyBadge({ name }: { name: string }) {
  const badge = companyBadge(name);
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
      style={{ backgroundColor: badge.bg, color: badge.color }}
      aria-hidden="true"
    >
      {badge.initials}
    </div>
  );
}
