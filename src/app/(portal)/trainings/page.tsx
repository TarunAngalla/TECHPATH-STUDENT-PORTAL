import { CandidateTrainingsList } from "@/components/candidate/CandidateTrainingsList";
import { getCandidateContext } from "@/lib/candidate-context";
import { getTrainingsForCandidate } from "@/lib/db/queries/shared/trainings";

export default async function TrainingsPage() {
  const { candidate } = await getCandidateContext();
  const trainings = await getTrainingsForCandidate(candidate.id);

  return (
    <CandidateTrainingsList
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
