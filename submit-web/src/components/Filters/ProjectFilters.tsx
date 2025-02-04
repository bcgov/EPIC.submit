import { Box, Grid, Typography } from "@mui/material";
import { SearchFilter } from "./SearchFilter";
import StatusFilter from "./StatusFilter";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { BCDesignTokens } from "epic.theme";
import { useProjectFilters } from "./projectFilterStore";
import DateSubmittedFromFilter from "./DateSubmittedFromFilter";
import DateSubmittedToFilter from "./DateSubmittedToFilter";

function ProjectFilters({userType}: {userType: string;}) {
  const { resetFilters } = useProjectFilters();

  return (
    <Grid
      container
      item
      sx={{ maxWidth: "1448px", justifyContent: "space-between" }}
    >
      <Grid item xs={2.5}>
        <SearchFilter userType={userType}/>
      </Grid>
      <Grid item xs={3.5}>
        <StatusFilter />
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
