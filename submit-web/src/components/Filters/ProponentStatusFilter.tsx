import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useProponentsHoldersTable } from "@/components/UserManagement/staff/ProponentsHoldersTable/proponentsHoldersTableStore";
import { ProponentStatus } from "@/models/Proponent";
import { ProponentStatusChip } from "../ProponentStatusChip";
import { BCDesignTokens } from "epic.theme";

const PROPONENT_STATUS_OPTIONS: ProponentStatus[] = [
  "ELIGIBLE",
  "PENDING_ONBOARDING",
  "INELIGIBLE",
  "ONBOARDED",
];

function ProponentStatusFilter() {
  const { statusFilters, setStatusFilters } = useProponentsHoldersTable();

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setStatusFilters(value);
  };

  return (
    <FormControl sx={{ width: "220px" }}>
      <Select
        labelId="proponent-status-select-label"
        id="proponent-status-select"
        placeholder="Status"
        value={statusFilters}
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
                  <ProponentStatusChip status={value as ProponentStatus} />
                </Box>
              ))}
            </div>
          );
        }}
      >
        {PROPONENT_STATUS_OPTIONS.map((status) => (
          <MenuItem key={status} value={status}>
            <ProponentStatusChip status={status} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default ProponentStatusFilter;

