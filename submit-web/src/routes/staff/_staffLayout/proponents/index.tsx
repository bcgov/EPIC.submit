import { ContentBox } from "@/components/Shared/ContentBox";
import { ProponentsHoldersTable } from "@/components/App/Proponents/ProponentsHoldersTable";
import { useProponentsHoldersTable } from "@/components/App/Proponents/ProponentsHoldersTable/proponentsHoldersTableStore";
import { Box, Grid, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { createFileRoute } from "@tanstack/react-router";
import ProponentStatusFilter from "@/components/Filters/ProponentStatusFilter";

export const Route = createFileRoute(
  "/staff/_staffLayout/proponents/",
)({
  component: ProponentsHolders,
  meta: () => [
    {
      title: "Proponents/Holders",
      path: "/staff/proponents",
    },
  ],
});

function ProponentsHolders() {
  const { searchText, setSearchText } = useProponentsHoldersTable();

  return (
    <Box
      sx={{
        padding: "36px 24px",
        width: "100%",
      }}
    >
      <Grid container spacing={2}>
        <Grid container item xs={12} spacing={2}>
          <Grid item xs={3}>
          <TextField
            value={searchText}
            variant="outlined"
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              margin: 0,
                width: "100%",
            }}
            placeholder="Search Proponents/Holders by Name"
            InputProps={{
              startAdornment: <SearchIcon htmlColor="#858a8c" />,
            }}
          />
          </Grid>
          <Grid item xs={3}>
            <ProponentStatusFilter />
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <ContentBox
            mainLabel="Proponents/Holders Information"
            sx={{ width: "100%", height: "fit-content" }}
            contentBoxVariant="secondary"
          >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Select a Proponent, Certificate Holder or Exemption Holder to
              generate the invite link &amp; view their EPIC.submit Account
              Admin(s).
            </Typography>
            <ProponentsHoldersTable sx={{ marginTop: "2em" }} />
          </ContentBox>
        </Grid>
      </Grid>
    </Box>
  );
}
