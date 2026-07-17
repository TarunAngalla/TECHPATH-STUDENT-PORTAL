import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

const iconVariants = {
  brand: "bg-brand-100 text-brand-600",
  teal: "bg-brand-50 text-brand-500",
  accent: "bg-accent-soft text-accent",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  iconVariant = "brand",
  href,
  onClick,
  variant = "glass",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconVariant?: keyof typeof iconVariants;
  href?: string;
  onClick?: () => void;
  variant?: "glass" | "solid";
}) {
  const content = (
    <>
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
          iconVariants[iconVariant],
        )}
      >
        <Icon size={17} aria-hidden="true" />
      </div>
      <div className="text-2xl font-semibold text-text-primary">{value}</div>
      <div className="text-xs mt-1 text-text-muted">{label}</div>
    </>
  );

  const cardClassName = cn("p-5 h-full w-full text-left", (href || onClick) && "cursor-pointer");

  if (href) {
    return (
      <Link href={href} className="flex-1 min-w-[160px] block">
        <Card variant={variant} hover="lift" className={cardClassName}>
          {content}
        </Card>
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="flex-1 min-w-[160px] block text-left">
        <Card variant={variant} hover="lift" className={cardClassName}>
          {content}
        </Card>
      </button>
    );
  }

  return (
    <Card variant={variant} hover="lift" className={cn("flex-1 min-w-[160px]", cardClassName)}>
      {content}
    </Card>
  );
}
