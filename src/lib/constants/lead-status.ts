import { C } from "./colors";

export const LEAD_STATUS_META = {
  new: { label: "New", color: C.slate, bg: C.slateSoft },
  contacted: { label: "Contacted", color: C.teal, bg: C.tealSoft },
  qualified: { label: "Qualified", color: C.green, bg: C.greenSoft },
  rejected: { label: "Rejected", color: C.red, bg: C.redSoft },
  converted: { label: "Converted", color: C.navy, bg: C.navySoft },
} as const;

export type LeadStatus = keyof typeof LEAD_STATUS_META;
