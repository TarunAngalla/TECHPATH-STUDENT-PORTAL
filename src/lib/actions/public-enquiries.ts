"use server";

import { headers } from "next/headers";
import {
  publicEnquirySchema,
  submitPublicEnquiry,
} from "@/lib/services/public-enquiries";

export type PublicEnquiryActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function clientKeyFromHeaders(values: Headers) {
  const forwarded = values.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = values.get("x-real-ip")?.trim();
  const ip = forwarded || realIp;
  if (ip) return ip;
  return `unknown:${values.get("user-agent") ?? "no-user-agent"}`;
}

export async function submitPublicEnquiryAction(
  _previous: PublicEnquiryActionState,
  formData: FormData,
): Promise<PublicEnquiryActionState> {
  const parsed = publicEnquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    optType: formData.get("optType") ?? "",
    roleInterest: formData.get("roleInterest"),
    experienceSummary: formData.get("experienceSummary") ?? "",
    additionalInformation: formData.get("additionalInformation") ?? "",
    consent: formData.get("consent") === "on",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Review the highlighted information and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const requestHeaders = await headers();
  try {
    const result = await submitPublicEnquiry({
      ...parsed.data,
      clientKey: clientKeyFromHeaders(requestHeaders),
    });
    if (!result.ok) return { error: result.error };
    return { success: true };
  } catch (error) {
    console.error("[public-enquiry] submission failed", error);
    return { error: "We could not submit your request. Please try again shortly." };
  }
}
