import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  ProponentItemForm,
  ProponentItemUpdateForm,
} from "@/components/SubmissionItem/ItemForm/ProponentItemForm";
import { getSubmissionItemQueryOptions } from "@/hooks/api/useItems";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import { getSubmissionItemLabel } from "@/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";

const LoadingSkeleton = () => (
  <PageGrid>
    <ContentBoxSkeleton />
  </PageGrid>
);
export const Route = createFileRoute(
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId"
)({
  component: Submission,
  loader: ({ context: { queryClient }, params: { submissionId } }) =>
    queryClient.ensureQueryData(
      getSubmissionItemQueryOptions({ itemId: Number(submissionId) })
    ),
  errorComponent: () => <Navigate to="/error" />,
  pendingComponent: LoadingSkeleton,
  meta: ({ loaderData: submissionItem }) => [
    { title: getSubmissionItemLabel(submissionItem.type.name) },
  ],
});

export function Submission() {
  const {
    submissionId: subItemId,
    submissionPackageId,
    projectId,
  } = Route.useParams();
  const { data: submissionItem, isLoading: isItemLoading } = useSuspenseQuery(
    getSubmissionItemQueryOptions({ itemId: Number(subItemId) })
  );

  const { data: submissionPackage, isLoading: isPackageLoading } =
    useSuspenseQuery(
      getSubmissionPackageQueryOptions({
        packageId: Number(submissionPackageId),
      })
    );

  const hasPackageUpdateRequest =
    submissionPackage?.update_requests.filter(
      (updateRequest) =>
        updateRequest.status !== UPDATE_REQUEST_STATUS.ACCEPTED.value &&
        updateRequest.active
    ).length > 0;
  const isPackageSubmitted = submissionPackage?.submitted_on;

  const isContactInformation =
    submissionItem.type.name === SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION;

  if (isItemLoading || isPackageLoading) {
    return <LoadingSkeleton />;
  }

  if (isPackageSubmitted && !hasPackageUpdateRequest && !isContactInformation) {
    return (
      <Navigate
        to={`/proponent/projects/${projectId}/submission-packages/${submissionPackageId}`}
      />
    );
  }

  if (!submissionItem) {
    notify.error("Failed to load submission item");
    return <Navigate to="/error" />;
  }

  return (
    <PageGrid>
      {isPackageSubmitted ? (
        <ProponentItemUpdateForm submissionItem={submissionItem} />
      ) : (
        <ProponentItemForm submissionItem={submissionItem} />
      )}
    </PageGrid>
  );
}
