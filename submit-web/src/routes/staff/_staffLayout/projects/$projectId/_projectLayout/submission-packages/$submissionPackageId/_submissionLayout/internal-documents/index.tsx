import { createFileRoute } from "@tanstack/react-router";
import { PageGrid } from "@/components/Shared/PageGrid";
import InternalDocuments from "@/components/SubmissionItem/InternalDocuments";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/internal-documents/"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageGrid>
      <InternalDocuments />
    </PageGrid>
  );
}
