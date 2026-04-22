import { Documents } from "@/components/App/Documents";
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

  const { data: projectsData, isPending: isProjectsLoading } =
    useGetAccountProjectsForStaff({ searchOptions: {}, pageSize: 1000 });

  const projects = useMemo(() => projectsData?.projects ?? [], [projectsData]);

  useEffect(() => {
    if (projects.length === 1 && !selectedProjectId) {
      setSelectedProjectId(projects[0].project_id);
    }
  }, [projects, selectedProjectId]);

  const {
    data: documentsData,
    isPending: isDocumentsLoading,
    isError: isDocumentsError,
  } = useGetSubmittedDocumentsForStaff({
    projectId: selectedProjectId === "" ? undefined : selectedProjectId,
    page: currentPage,
    size: pageSize,
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
                    borderColor: "#D1CFCD",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D1CFCD",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D1CFCD",
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
