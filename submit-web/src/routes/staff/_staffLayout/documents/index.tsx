import { Documents } from "@/components/App/Documents";
import { DocumentFilter, DocumentFilters } from "@/components/App/Documents/DocumentFilter";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetSubmittedDocumentsForStaff } from "@/hooks/api/useSubmittedDocuments";
import { useGetAccountProjectsForStaff } from "@/hooks/api/useProjects";
import {
  Box,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { PaginatedDocumentsResponse } from "@/models/Submission";
import { When } from "react-if";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";

export const Route = createFileRoute("/staff/_staffLayout/documents/")({
  component: DocumentsPage,
  head: () => ({ meta: [{ title: "All Documents" }] }),
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
    useGetAccountProjectsForStaff({ searchOptions: {}, pageSize: 1000 });

  const projects = useMemo(() => projectsData?.projects ?? [], [projectsData]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.project_id === selectedProjectId);
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (projects.length === 1 && !selectedProjectId) {
      setSelectedProjectId(projects[0].project_id);
    }
  }, [projects, selectedProjectId]);

  const searchOptions = useMemo(() => ({
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
  }), [filters]);

  const {
    data: documentsData,
    isPending: isDocumentsLoading,
    isError: isDocumentsError,
  } = useGetSubmittedDocumentsForStaff({
    projectId: selectedProjectId === "" ? undefined : selectedProjectId,
    page: currentPage,
    size: pageSize,
    searchOptions: searchOptions as any,
  });

  useEffect(() => {
    if (isDocumentsError) {
      notify.error("Failed to load documents");
    }
  }, [isDocumentsError]);

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
        />
        <ContentBox mainLabel={"Documents"} contentBoxVariant="secondary">
          {!isProjectsLoading ? (
            <Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
              <Typography variant="h6" sx={{ mr: 4 }}>
                Select a Project:
              </Typography>
              <Select
                id="project-select"
                value={selectedProjectId}
                displayEmpty
                size="small"
                onChange={(e) => handleProjectChange(e.target.value as number)}
                sx={{
                  width: "50%",
                  borderRadius: 1,
                  "& .MuiSelect-select": {
                    py: 1.5,
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: selectedProjectId === "" && (filters.name || filters.workPhase || filters.submissionType || filters.status || filters.submittedOnStart || filters.submittedOnEnd) ? "error.main" : "#D1CFCD",
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select a project to view documents
                </MenuItem>
                {projects.map((ap) => (
                  <MenuItem key={ap.project_id} value={ap.project_id}>
                    {ap.project.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          ) : (
            <CircularProgress />
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
