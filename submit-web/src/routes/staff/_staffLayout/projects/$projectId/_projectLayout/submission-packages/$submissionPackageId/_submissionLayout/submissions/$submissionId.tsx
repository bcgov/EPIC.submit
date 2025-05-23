import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { StaffItemForm } from "@/components/SubmissionItem/ItemForm/StaffItemForm";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { getSubmissionItemLabel } from "@/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
)({
  component: Submission,
  loader: ({ context: { queryClient }, params: { submissionId } }) =>
    queryClient.ensureQueryData(
      getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionId) }),
    ),
  errorComponent: () => <Navigate to="/error" />,
  pendingComponent: () => (
    <PageGrid>
      <ContentBoxSkeleton />
    </PageGrid>
  ),
  meta: ({ loaderData: submissionItem }) => [
    { title: getSubmissionItemLabel(submissionItem.type.name) },
  ],
});

export function Submission() {
  const { submissionId: subItemId } = Route.useParams();
  const { data: submissionItem } = useSuspenseQuery(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(subItemId) }),
  );

  if (!submissionItem) {
    notify.error("Failed to load submission item");
    return <Navigate to="/error" />;
  }

  return (
    <PageGrid>
      <StaffItemForm submissionItem={submissionItem} />
    </PageGrid>
  );
}
