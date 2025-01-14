import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useProjectFilters } from "./projectFilterStore";
import { SUBMISSION_ITEM_STATUS } from "@/models/Submission";
import { SubmissionStatusChip } from "../SubmissionStatusChip";
import { BCDesignTokens } from "epic.theme";

function StatusFilter() {
  const { filters, setFilters } = useProjectFilters();

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    if (value.includes("all")) {
      setFilters({
        status: Object.values(SUBMISSION_ITEM_STATUS).map(
          (status) => status.value,
        ),
      });
    } else if (value.length <= 2) {
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
        {Object.values(SUBMISSION_ITEM_STATUS).map((status) => (
          <MenuItem key={status.value} value={status.value}>
            <SubmissionStatusChip status={status.value} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default StatusFilter;
