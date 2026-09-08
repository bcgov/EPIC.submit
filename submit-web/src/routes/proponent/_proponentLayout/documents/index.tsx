import { Documents } from "@/components/App/Documents";
import {
  DocumentFilter,
  DocumentFilters,
} from "@/components/App/Documents/DocumentFilter";
import { ProjectsSelect } from "@/components/App/Projects/ProjectsSelect";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetAccountProjects } from "@/hooks/api/useProjects";
import { hasPermission } from "@/components/Shared/PermissionGate/utils";
import { useGetSubmittedDocuments } from "@/hooks/api/useSubmittedDocuments";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import { PaginatedDocumentsResponse } from "@/models/Submission";
import { Box, Grid, Typography } from "@mui/material";
import { createFileRoute, Navigate, notFound } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useEffect, useMemo, useState } from "react";
import { When } from "react-if";

export const Route = createFileRoute("/proponent/_proponentLayout/documents/")({
  component: DocumentsPage,
  head: () => ({ meta: [{ title: "All Documents" }] }),
  beforeLoad: async ({ context: { account } }) => {
    if (
      !account.isLoading &&
      !hasPermission({
        scopes: [ACCOUNT_USER_PERMISSIONS.VIEW_ALL_DOCUMENTS],
        permissions: account?.roles || [],
      })
    ) {
      throw notFound();
    }
  },
});

function DocumentsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState<DocumentFilters>({
    name: "",
    workPhase: [],
    submissionType: [],
    status: [],
    submittedOnStart: "",
    submittedOnEnd: "",
  });

  const { data: projectsData, isPending: isProjectsLoading } =
    useGetAccountProjects({ searchOptions: {}, pageSize: 1000 });

  const projects = useMemo(() => projectsData?.projects ?? [], [projectsData]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.project_id === selectedProjectId);
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (projects.length === 1 && !selectedProjectId) {
      setSelectedProjectId(projects[0].project_id);
    }
  }, [projects, selectedProjectId]);

  const searchOptions = useMemo(
    () => ({
      ...(filters.name && { name: filters.name }),
      ...(filters.workPhase.length > 0 && { work_phase: filters.workPhase }),
      ...(filters.submissionType.length > 0 && {
        submission_type: filters.submissionType,
      }),
      ...(filters.status.length > 0 && { status: filters.status }),
      ...(filters.submittedOnStart && {
        submitted_on_start: filters.submittedOnStart,
      }),
      ...(filters.submittedOnEnd && {
        submitted_on_end: filters.submittedOnEnd,
      }),
    }),
    [filters],
  );

  const {
    data: documentsData,
    isPending: isDocumentsLoading,
    isError: isDocumentsError,
  } = useGetSubmittedDocuments({
    projectId: selectedProjectId || undefined,
    page: currentPage,
    size: pageSize,
    searchOptions: searchOptions as any,
    enabled: selectedProjectId !== "",
  });

  const { data: unfilteredDocumentsData } = useGetSubmittedDocuments({
    projectId: selectedProjectId || undefined,
    page: 1,
    size: 1000,
    searchOptions: {} as any,
    enabled: selectedProjectId !== "",
  });

  useEffect(() => {
    if (isDocumentsError) {
      notify.error("Failed to load documents");
    }
  }, [isDocumentsError]);

  const availableStatuses = useMemo(() => {
    const data = unfilteredDocumentsData as PaginatedDocumentsResponse;
    if (!data?.items) return [];
    return Array.from(new Set(data.items.map((doc) => doc.status))).filter(
      Boolean,
    );
  }, [unfilteredDocumentsData]);

  if (isDocumentsError) {
    return <Navigate to={"/error"} />;
  }

  const handleProjectChange = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <PageGrid>
      <Grid item xs={12}>
        <DocumentFilter
          filters={filters}
          setFilters={handleFilterChange}
          selectedProject={selectedProject}
          projectSelected={selectedProjectId !== ""}
          availableStatuses={availableStatuses}
        />
        <ContentBox mainLabel={"Documents"} contentBoxVariant="secondary">
          {projects.length > 1 ? (
            <ProjectsSelect
              projects={projects}
              isProjectsLoading={isProjectsLoading}
              selectedProjectId={selectedProjectId}
              filters={filters}
              onProjectChange={handleProjectChange}
            />
          ) : (
            <Typography
              variant="h5"
              sx={{ mb: BCDesignTokens.layoutMarginMedium }}
            >
              {selectedProject?.project.name}
            </Typography>
          )}
          <Box
            display={"flex"}
            flexDirection="column"
            sx={{
              pt: BCDesignTokens.layoutPaddingSmall,
              pb: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            <When condition={selectedProjectId !== ""}>
              <Documents
                data={documentsData as PaginatedDocumentsResponse}
                isLoading={isDocumentsLoading}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </When>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
