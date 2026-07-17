import { redirectIfAuthenticated } from "@/lib/auth/guards";
import { CandidateLoginForm } from "@/components/candidate/CandidateLoginForm";

export default async function CandidateLoginPage() {
  await redirectIfAuthenticated("candidate");
  return <CandidateLoginForm />;
}
