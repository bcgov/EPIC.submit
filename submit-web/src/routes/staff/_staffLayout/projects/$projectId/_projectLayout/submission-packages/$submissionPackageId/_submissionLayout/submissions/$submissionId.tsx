import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { StaffItemForm } from "@/components/App/SubmissionItem/ItemForm/StaffItemForm";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { getSubmissionItemLabel } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, notFound } from "@tanstack/react-router";
import { isAxiosError } from "axios";

export const Route = createFileRoute(
  "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
)({
  component: Submission,
  loader: ({ context: { queryClient }, params: { submissionId } }) =>
    queryClient.ensureQueryData(
      getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionId) }),
    ),
  onError: (error) => {
    if (
      isAxiosError(error) &&
      error.response?.status === HTTP_STATUS.NOT_FOUND
    ) {
      throw notFound();
    }
    throw error;
  },
  pendingMs: 0,
  pendingComponent: () => (
    <PageGrid>
      <ContentBoxSkeleton />
    </PageGrid>
  ),
  meta: ({ loaderData: submissionItem }) => [
    { title: getSubmissionItemLabel(submissionItem?.type.name) },
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
