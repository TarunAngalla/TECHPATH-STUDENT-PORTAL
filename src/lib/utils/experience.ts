/** experience_summary stores years of experience; ignore old free-text summaries. */
export const EXPERIENCE_YEARS_PATTERN = /^(\d+(?:\.\d+)?)\s*(years?|yrs?)?$/i;

export function formatExperienceYears(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return "—";
  const match = raw.match(EXPERIENCE_YEARS_PATTERN);
  if (!match) return "—";
  const n = match[1];
  return `${n} yr${n === "1" ? "" : "s"}`;
}
