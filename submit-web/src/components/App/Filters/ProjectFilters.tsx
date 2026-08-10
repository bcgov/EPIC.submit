import { Box, Grid, Typography } from "@mui/material";
import { SearchFilter } from "./SearchFilter";
import StatusFilter from "./StatusFilter";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { BCDesignTokens } from "epic.theme";
import { useProjectFilters } from "./projectFilterStore";
import DateSubmittedFromFilter from "./DateSubmittedFromFilter";
import DateSubmittedToFilter from "./DateSubmittedToFilter";
import {
  EAO_PACKAGE_STATUS_FILTERS,
  PackageStatus,
  PROPONENT_PACKAGE_STATUS_FILTERS,
} from "@/models/Package";
import { USER_TYPE } from "@/models/User";
import PackageStatusChip from "../PackageStatusChip";

function ProjectFilters({ userType }: { userType: string }) {
  const { resetFilters } = useProjectFilters();
  const isProponent = userType === USER_TYPE.PROPONENT;

  return (
    <Grid
      container
      item
      sx={{ maxWidth: "1448px", justifyContent: "space-between" }}
    >
      <Grid item xs={2.5}>
        <SearchFilter userType={userType} />
      </Grid>
      <Grid item xs={3.5}>
        <StatusFilter<PackageStatus>
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
