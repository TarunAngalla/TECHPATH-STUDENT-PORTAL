import { CandidateTrainingsList } from "@/components/candidate/CandidateTrainingsList";
import { getCandidateContext } from "@/lib/candidate-context";
import { serverFeatures } from "@/lib/config/features";
import {
  ensureCandidateHasCatalogTrainings,
  getTrainingsForCandidate,
} from "@/lib/db/queries/shared/trainings";

export default async function TrainingsPage() {
  const { candidate } = await getCandidateContext();
  await ensureCandidateHasCatalogTrainings(candidate.id);
  const trainings = await getTrainingsForCandidate(candidate.id);

  return (
    <CandidateTrainingsList
      allowSelfComplete={serverFeatures.candidateTrainingSelfComplete}
      trainings={trainings.map((t) => ({
        id: t.id,
        status: t.status,
        title: t.title,
        type: t.type,
        contentUrl: t.contentUrl,
      }))}
    />
  );
}
