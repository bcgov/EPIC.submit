import { Documents, DocumentsSkeleton } from "@/components/App/Documents";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetSubmittedDocumentsForStaff } from "@/hooks/api/useSubmittedDocuments";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Else, If, Then } from "react-if";

export const Route = createFileRoute("/staff/_staffLayout/documents/")({
  component: DocumentsPage,
  meta: () => [{ title: "All Documents" }],
});

function DocumentsPage() {
  const {
    data: documentsData,
    isPending: isDocumentsLoading,
    isError: isDocumentsError,
  } = useGetSubmittedDocumentsForStaff({
    searchOptions: undefined,
  });

  useEffect(() => {
    if (isDocumentsError) {
      notify.error("Failed to load documents");
    }
  }, [isDocumentsError]);

  if (isDocumentsError) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isDocumentsLoading}>
          <Then>
            <DocumentsSkeleton />
          </Then>
          <Else>
            <Documents documents={documentsData} />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
