import { C } from "@/lib/constants/colors";

export const COMPANY_STYLES = [
  { bg: C.navySoft, color: C.navy },
  { bg: C.tealSoft, color: C.teal },
  { bg: C.amberSoft, color: C.amber },
  { bg: "#F1EAFB", color: "#6B3FA0" },
  { bg: C.redSoft, color: C.red },
] as const;

export function companyBadge(name: string) {
  const idx = name.length % COMPANY_STYLES.length;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return { ...COMPANY_STYLES[idx], initials };
}
