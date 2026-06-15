import {
  Box,
  CircularProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { AccountProject } from "@/models/Project"; // adjust import to your actual project type
import { DocumentFilters } from "@/components/App/Documents/DocumentFilter";

interface ProjectsSelectProps {
  projects: AccountProject[];
  isProjectsLoading: boolean;
  selectedProjectId: number | "";
  filters: DocumentFilters;
  onProjectChange: (projectId: number) => void;
}

export function ProjectsSelect({
  projects,
  isProjectsLoading,
  selectedProjectId,
  filters,
  onProjectChange,
}: ProjectsSelectProps) {
  if (isProjectsLoading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
      <Typography variant="h6" sx={{ mr: 4 }}>
        Select a Project:
      </Typography>
      <Select
        id="project-select"
        value={selectedProjectId}
        displayEmpty
        size="small"
        onChange={(e) => onProjectChange(e.target.value as number)}
        sx={{
          width: "50%",
          borderRadius: 1,
          "& .MuiSelect-select": {
            py: 1.5,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor:
              selectedProjectId === "" &&
              (filters.name ||
                filters.workPhase ||
                filters.submissionType ||
                filters.status ||
                filters.submittedOnStart ||
                filters.submittedOnEnd)
                ? "error.main"
                : "#D1CFCD",
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
  );
}
