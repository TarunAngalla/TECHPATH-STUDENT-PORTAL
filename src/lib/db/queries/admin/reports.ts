import { getDashboardStats } from "./dashboard";
import { getCandidatesList } from "./candidates";

export async function getReportsData() {
  const stats = await getDashboardStats();
  const candidates = await getCandidatesList();
  return { ...stats, candidates };
}
