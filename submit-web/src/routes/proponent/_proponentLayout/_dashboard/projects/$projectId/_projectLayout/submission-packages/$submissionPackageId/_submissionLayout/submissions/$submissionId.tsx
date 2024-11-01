import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { ItemForm } from "@/components/SubmissionItem/ItemForm";
import { getSubmissionItemQueryOptions } from "@/hooks/api/useItems";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
)({
  component: Submission,
  loader: ({ context: { queryClient }, params: { submissionId } }) =>
    queryClient.ensureQueryData(
      getSubmissionItemQueryOptions({ itemId: Number(submissionId) }),
    ),
  errorComponent: () => <Navigate to="/error" />,
  pendingComponent: () => (
    <PageGrid>
      <ContentBoxSkeleton />
    </PageGrid>
  ),
  meta: ({ loaderData: submissionItem }) => [
    { title: submissionItem.type.name },
  ],
});

export function Submission() {
  const { submissionId: subItemId } = Route.useParams();
  const { data: submissionItem } = useSuspenseQuery(
    getSubmissionItemQueryOptions({ itemId: Number(subItemId) }),
  );

  if (!submissionItem) {
    notify.error("Failed to load submission item");
    return <Navigate to="/error" />;
  }
  return (
    <PageGrid>
      <ItemForm submissionItem={submissionItem} />
    </PageGrid>
  );
}
