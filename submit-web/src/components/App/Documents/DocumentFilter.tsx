import DateSubmittedFromFilter from "@/components/App/Filters/DateSubmittedFromFilter";
import DateSubmittedToFilter from "@/components/App/Filters/DateSubmittedToFilter";
import { SearchFilter } from "@/components/App/Filters/SearchFilter";
import StatusFilter from "@/components/App/Filters/StatusFilter";
import { useGetNonWorkPackageMapsByProjectId } from "@/hooks/api/useNonWorkPackageMaps";
import { useGetPackageTypesByProjectId } from "@/hooks/api/usePackageTypes";
import { AccountProject } from "@/models/Project";
import {
  EAO_SUBMISSION_ITEM_FILTERS,
  PROPONENT_SUBMISSION_ITEM_FILTERS,
  SubmissionItemStatus,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
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
import { SubmissionStatusChip } from "../SubmissionStatusChip";
import { buildWorkPhaseOptions } from "./workPhaseOptions";

export type DocumentFilters = {
  name: string;
  workPhase: string[];
  submissionType: string[];
  status: SubmissionItemStatus[];
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

  const { userType } = useAccount();
  const isProponent = userType === USER_TYPE.PROPONENT;

  // Available Work/Phases: the project's works plus the non-work package maps (e.g. Management Plan)
  // it is eligible for. Each option's value is the key the API filters on.
  const { data: nonWorkPackageMaps } = useGetNonWorkPackageMapsByProjectId({
    projectId: selectedProject?.project_id,
    enabled: Boolean(selectedProject),
  });
  const availableWorkPhases = useMemo(() => {
    if (!selectedProject) return [];
    return buildWorkPhaseOptions(
      selectedProject.account_project_works,
      nonWorkPackageMaps,
    );
  }, [selectedProject, nonWorkPackageMaps]);
  const workPhaseLabels = useMemo(
    () => new Map(availableWorkPhases.map((wp) => [wp.value, wp.label])),
    [availableWorkPhases],
  );

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
        spacing={2}
        sx={{
          maxWidth: "1448px",
          justifyContent: "space-between",
          pointerEvents: !projectSelected ? "none" : "auto",
        }}>
        {/* Name Search */}
        <Grid size={2.5}>
          <SearchFilter
            value={searchTerm}
            onApply={handleSearchApply}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
            placeholder="Search Documents by Name"
          />
        </Grid>

        {/* Work/Phase */}
        <Grid size={2}>
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
                      <Chip
                        key={value}
                        label={workPhaseLabels.get(value) ?? value}
                        size="small"
                      />
                    ))}
                  </Box>
                );
              }}
            >
              {availableWorkPhases.map((wp) => (
                <MenuItem key={wp.value} value={wp.value}>
                  {wp.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Submission Type */}
        <Grid size={2}>
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
        <Grid size={1.5}>
          <StatusFilter<SubmissionItemStatus>
            value={filters.status}
            onChange={(val) => handleFilterChange("status", val)}
            multiple={true}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
            availableStatuses={availableStatuses}
            roleFilters={
              isProponent
                ? PROPONENT_SUBMISSION_ITEM_FILTERS
                : EAO_SUBMISSION_ITEM_FILTERS
            }
            renderChip={(value, label) => (
              <SubmissionStatusChip status={value} label={label} />
            )}
          />
        </Grid>

        {/* Date Ranges */}
        <Grid size={1.5}>
          <DateSubmittedFromFilter
            value={filters.submittedOnStart}
            onChange={(val) => handleFilterChange("submittedOnStart", val)}
            maxDate={filters.submittedOnEnd}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
          />
        </Grid>
        <Grid size={1.5}>
          <DateSubmittedToFilter
            value={filters.submittedOnEnd}
            onChange={(val) => handleFilterChange("submittedOnEnd", val)}
            minDate={filters.submittedOnStart}
            error={!projectSelected && showValidation}
            onFocus={handleValidationCheck}
          />
        </Grid>

        {/* Clear Filters */}
        <Grid container size={1}>
          <Box
            onClick={clearAllFilters}
            sx={{
              display: "flex",
              flexDirection: "row",
              mt: BCDesignTokens.layoutMarginSmall,
              cursor: "pointer"
            }}>
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
