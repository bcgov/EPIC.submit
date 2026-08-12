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
    <Grid
      container
      item
      sx={{ maxWidth: "1448px", justifyContent: "space-between" }}
    >
      <Grid item xs={!hideStatusFilter ? 2.5 : 6}>
        <SearchFilter userType={userType} />
      </Grid>
      {!hideStatusFilter && (
        <Grid item xs={3.5}>
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
      <Grid item xs={2}>
        <DateSubmittedFromFilter />
      </Grid>
      <Grid item xs={2}>
        <DateSubmittedToFilter />
      </Grid>
      <Grid container item xs={1}>
        <Box
          display={"flex"}
          flexDirection={"row"}
          mt={BCDesignTokens.layoutMarginSmall}
          onClick={() => resetFilters()}
          sx={{ cursor: "pointer" }}
        >
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
