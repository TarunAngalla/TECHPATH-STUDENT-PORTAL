import { requireStaffAuth } from "@/lib/auth/guards";
import {
  ensureAllCandidatesHaveCatalogTrainings,
  getTrainingCatalog,
} from "@/lib/db/queries/shared/trainings";
import { TrainingsLibrary } from "@/components/admin/TrainingsLibrary";

export default async function AdminTrainingsPage() {
  const session = await requireStaffAuth();
  // Keep candidate portals in sync with the library (idempotent).
  await ensureAllCandidatesHaveCatalogTrainings();
  const trainings = await getTrainingCatalog();

  return <TrainingsLibrary trainings={trainings} canCreate={session.role === "admin"} />;
}
