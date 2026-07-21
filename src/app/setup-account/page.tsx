import type { Metadata } from "next";
import {
  AccountSetupForm,
  InvalidAccountSetupLink,
} from "@/components/candidate/AccountSetupForm";
import { getValidCandidateInvite } from "@/lib/services/candidate-invites";

export const metadata: Metadata = {
  title: "Set Up Account | The TechPath",
  robots: { index: false, follow: false },
};

export default async function SetupAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) return <InvalidAccountSetupLink />;

  const invite = await getValidCandidateInvite(token);
  if (!invite) return <InvalidAccountSetupLink />;

  return (
    <AccountSetupForm
      token={token}
      fullName={invite.fullName}
      email={invite.email}
      expiresAt={invite.expiresAt}
    />
  );
}
