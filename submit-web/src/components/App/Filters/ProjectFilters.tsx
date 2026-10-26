import {
  EAO_PACKAGE_STATUS_FILTERS,
  PackageStatusFilterValue,
  PROPONENT_PACKAGE_STATUS_FILTERS,
} from "@/models/Package";
import { USER_TYPE } from "@/models/User";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { Box, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import PackageStatusChip from "../PackageStatusChip";
import DateSubmittedFromFilter from "./DateSubmittedFromFilter";
import DateSubmittedToFilter from "./DateSubmittedToFilter";
import { useProjectFilters } from "./projectFilterStore";
import { SearchFilter } from "./SearchFilter";
import StatusFilter from "./StatusFilter";

function ProjectFilters({
  userType,
  hideStatusFilter,
}: {
  userType: string;
  hideStatusFilter: boolean;
}) {
  const { resetFilters } = useProjectFilters();
  const isProponent = userType === USER_TYPE.PROPONENT;

  return (
    <Grid container sx={{ maxWidth: "1448px", justifyContent: "space-between" }}>
      <Grid size={!hideStatusFilter ? 2.5 : 6}>
        <SearchFilter userType={userType} />
      </Grid>
      {!hideStatusFilter && (
        <Grid size={3.5}>
          <StatusFilter<PackageStatusFilterValue>
            label="Post-Decision Submission Status"
            roleFilters={
              isProponent
                ? PROPONENT_PACKAGE_STATUS_FILTERS
                : EAO_PACKAGE_STATUS_FILTERS
            }
            renderChip={(value, label) => (
              <PackageStatusChip status={value} label={label} />
            )}
          />
        </Grid>
      )}
      <Grid size={2}>
        <DateSubmittedFromFilter />
      </Grid>
      <Grid size={2}>
        <DateSubmittedToFilter />
      </Grid>
      <Grid container size={1}>
        <Box
          onClick={() => resetFilters()}
          sx={{
            display: "flex",
            flexDirection: "row",
            mt: BCDesignTokens.layoutMarginSmall,
            cursor: "pointer"
          }}>
          <Typography
            variant="caption"
            sx={{
              color: BCDesignTokens.typographyColorLink,
            }}
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
  );
}

export default ProjectFilters;
