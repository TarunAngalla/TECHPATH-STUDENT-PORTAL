import type { Metadata } from "next";
import { RequestAccessForm } from "@/components/public/RequestAccessForm";

export const metadata: Metadata = {
  title: "Request Access | The TechPath",
  description: "Request access to the TechPath candidate portal.",
};

export default function RequestAccessPage() {
  return <RequestAccessForm />;
}
