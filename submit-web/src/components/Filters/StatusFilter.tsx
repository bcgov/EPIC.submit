import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useProjectFilters } from "./projectFilterStore";
import {
  EAO_SUBMISSION_ITEM_FILTERS,
  PROPONENT_SUBMISSION_ITEM_FILTERS,
} from "@/models/Submission";
import { SubmissionStatusChip } from "../SubmissionStatusChip";
import { BCDesignTokens } from "epic.theme";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";

function StatusFilter() {
  const { filters, setFilters } = useProjectFilters();
  const { userType } = useAccount();
  const isProponent = userType === USER_TYPE.PROPONENT;

  const statusFilters = !isProponent
    ? PROPONENT_SUBMISSION_ITEM_FILTERS
    : EAO_SUBMISSION_ITEM_FILTERS;

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    if (value.includes("all")) {
      setFilters({
        status: Object.values(statusFilters).map((status) => status.value),
      });
    } else if (value.length <= 3) {
      setFilters({ status: value });
    }
  };

  return (
    <FormControl fullWidth>
      <Select
        labelId="status-select-label"
        id="status-select"
        placeholder="Status"
        value={filters.status}
        multiple
        displayEmpty
        onChange={handleChange}
        sx={{
          "& .MuiInputBase-input": {
            p: BCDesignTokens.layoutPaddingSmall,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault} !important`,
          },
        }}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return (
              <Typography
                variant="body2"
                color={BCDesignTokens.typographyColorDisabled}
                sx={{
                  lineHeight: BCDesignTokens.typographyLineHeightsXxdense,
                }}
              >
                Status
              </Typography>
            );
          }

          return (
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {(selected as string[]).map((value) => (
                <Box key={value} mr={1}>
                  <SubmissionStatusChip status={value} />
                </Box>
              ))}
            </div>
          );
        }}
      >
        {Object.values(statusFilters).map((status) => (
          <MenuItem key={status.value} value={status.value}>
            <SubmissionStatusChip status={status.value} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default StatusFilter;
