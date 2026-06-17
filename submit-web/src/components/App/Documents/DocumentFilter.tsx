import DateSubmittedFromFilter from "@/components/App/Filters/DateSubmittedFromFilter";
import DateSubmittedToFilter from "@/components/App/Filters/DateSubmittedToFilter";
import { SearchFilter } from "@/components/App/Filters/SearchFilter";
import StatusFilter from "@/components/App/Filters/StatusFilter";
import { useGetPackageTypesByProjectId } from "@/hooks/api/usePackageTypes";
import { AccountProject } from "@/models/Project";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useMemo, useState } from "react";

export type DocumentFilters = {
  name: string;
  workPhase: string[];
  submissionType: string[];
  status: string[];
  submittedOnStart: string;
  submittedOnEnd: string;
};

type DocumentFilterProps = {
  filters: DocumentFilters;
  setFilters: (filters: DocumentFilters) => void;
  selectedProject: AccountProject | undefined;
  projectSelected: boolean;
  availableStatuses?: string[];
};

export const DocumentFilter = ({
  filters,
  setFilters,
  selectedProject,
  projectSelected,
  availableStatuses,
}: DocumentFilterProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.name);
  const [showValidation, setShowValidation] = useState(false);

  // Available Work/Phases from selected project
  const availableWorkPhases = useMemo(() => {
    if (!selectedProject) return [];

    const workPhases = [];

    if (selectedProject.account_project_works) {
      workPhases.push(
        ...selectedProject.account_project_works.map((apw) => {
          const workTitle = apw.work?.title ?? "";
          const phaseName = apw.work?.current_phase?.name ?? "";
          return `${workTitle} - ${phaseName}`;
        }),
      );
    }

    if (selectedProject.project.has_approved_condition) {
      workPhases.push("Management Plan & Related Documents - Post Decision");
    }

    // Return unique values
    return Array.from(new Set(workPhases)).filter(Boolean);
  }, [selectedProject]);

  // Submission types
  const { data: packageTypes } = useGetPackageTypesByProjectId({
    projectId: selectedProject?.project_id,
    enabled: Boolean(selectedProject),
  });
  const submissionTypes = packageTypes?.map((pt) => pt.name) ?? [];

  const handleFilterChange = (
    key: keyof DocumentFilters,
    value: string | string[],
  ) => {
    if (!projectSelected) {
      setShowValidation(true);
      return;
    }
    setFilters({ ...filters, [key]: value });
  };

  const handleSearchApply = (value: string) => {
    if (!projectSelected) {
      setShowValidation(true);
      return;
    }
    setSearchTerm(value);
    setFilters({ ...filters, name: value });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilters({
      name: "",
      workPhase: [],
      submissionType: [],
      status: [],
      submittedOnStart: "",
      submittedOnEnd: "",
    });
    setShowValidation(false);
  };

  const handleValidationCheck = () => {
    if (!projectSelected) {
      setShowValidation(true);
      return true;
    }
    return false;
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Grid
        container
        item
        spacing={2}
        sx={{
          maxWidth: "1448px",
          justifyContent: "space-between",
          pointerEvents: !projectSelected ? "none" : "auto",
        }}
      >
        {/* Name Search */}
        <Grid item xs={2.5}>
          <SearchFilter
            value={searchTerm}
            onApply={handleSearchApply}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
            placeholder="Search Documents by Name"
          />
        </Grid>

        {/* Work/Phase */}
        <Grid item xs={2}>
          <FormControl fullWidth error={!projectSelected && showValidation}>
            <Select
              displayEmpty
              multiple
              value={filters.workPhase}
              onChange={(e) =>
                handleFilterChange("workPhase", e.target.value as string[])
              }
              onFocus={handleValidationCheck}
              sx={{
                "& .MuiInputBase-input": {
                  p: BCDesignTokens.layoutPaddingSmall,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault} !important`,
                },
              }}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return (
                    <Typography
                      variant="body2"
                      color={BCDesignTokens.typographyColorDisabled}
                      sx={{
                        lineHeight: BCDesignTokens.typographyLineHeightsXxdense,
                      }}
                    >
                      Work/Phase
                    </Typography>
                  );
                }
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                );
              }}
            >
              {availableWorkPhases.map((wp) => (
                <MenuItem key={wp} value={wp}>
                  {wp}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Submission Type */}
        <Grid item xs={2}>
          <FormControl fullWidth error={!projectSelected && showValidation}>
            <Select
              displayEmpty
              multiple
              value={filters.submissionType}
              onChange={(e) =>
                handleFilterChange("submissionType", e.target.value as string[])
              }
              onFocus={handleValidationCheck}
              sx={{
                "& .MuiInputBase-input": {
                  p: BCDesignTokens.layoutPaddingSmall,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault} !important`,
                },
              }}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) {
                  return (
                    <Typography
                      variant="body2"
                      color={BCDesignTokens.typographyColorDisabled}
                      sx={{
                        lineHeight: BCDesignTokens.typographyLineHeightsXxdense,
                      }}
                    >
                      Submission Type
                    </Typography>
                  );
                }
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                );
              }}
            >
              {submissionTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status */}
        <Grid item xs={1.5}>
          <StatusFilter
            multiple={true}
            value={filters.status}
            onChange={(val) => handleFilterChange("status", val)}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
            availableStatuses={availableStatuses}
          />
        </Grid>

        {/* Date Ranges */}
        <Grid item xs={1.5}>
          <DateSubmittedFromFilter
            value={filters.submittedOnStart}
            onChange={(val) => handleFilterChange("submittedOnStart", val)}
            maxDate={filters.submittedOnEnd}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
          />
        </Grid>
        <Grid item xs={1.5}>
          <DateSubmittedToFilter
            value={filters.submittedOnEnd}
            onChange={(val) => handleFilterChange("submittedOnEnd", val)}
            minDate={filters.submittedOnStart}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
          />
        </Grid>

        {/* Clear Filters */}
        <Grid item xs={1} container>
          <Box
            display={"flex"}
            flexDirection={"row"}
            mt={BCDesignTokens.layoutMarginSmall}
            onClick={clearAllFilters}
            sx={{ cursor: "pointer" }}
          >
            <Typography
              variant="caption"
              sx={{ color: BCDesignTokens.typographyColorLink }}
            >
              Clear Filters
            </Typography>
            <FilterAltOffOutlinedIcon
              fontSize="small"
              htmlColor={BCDesignTokens.typographyColorLink}
            />
          </Box>
        </Grid>
      </Grid>
      {!projectSelected && showValidation && (
        <FormHelperText error sx={{ ml: 0, mt: 1 }}>
          Please select a project first.
        </FormHelperText>
      )}
    </Box>
  );
};
