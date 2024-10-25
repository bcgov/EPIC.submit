import { ContentBoxSkeleton } from "@/components/Shared/ContentBox/ContentBoxSkeleton";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { ItemForm } from "@/components/SubmissionItem/ItemForm";
import { useGetSubmissionItem } from "@/hooks/api/useItems";
import {
  createFileRoute,
  Navigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

const META_TITLE = `Submission Type`;

export const Route = createFileRoute(
  "/_authenticated/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
)({
  component: Submission,
  meta: () => [{ title: META_TITLE }],
});

export function Submission() {
  const { submissionId: subItemId } = Route.useParams();
  const { data: submissionItem, isPending: isSubmissionPending } =
    useGetSubmissionItem({ itemId: Number(subItemId) });
  const { replaceBreadcrumb } = useBreadCrumb();
  const matches = useRouterState({ select: (s) => s.matches });

  useEffect(() => {
    if (submissionItem)
      replaceBreadcrumb(META_TITLE, submissionItem?.type.name || "");
  }, [submissionItem, replaceBreadcrumb, matches]);

  if (isSubmissionPending) {
    return (
      <PageGrid>
        <ContentBoxSkeleton />
      </PageGrid>
    );
  }

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
