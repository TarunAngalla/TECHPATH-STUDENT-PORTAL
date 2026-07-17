import { getTrainingCatalog } from "@/lib/db/queries/shared/trainings";
import { TrainingsLibrary } from "@/components/admin/TrainingsLibrary";

export default async function AdminTrainingsPage() {
  const trainings = await getTrainingCatalog();

  return <TrainingsLibrary trainings={trainings} />;
}
