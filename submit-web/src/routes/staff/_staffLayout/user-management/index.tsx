import { ContentBox } from "@/components/Shared/ContentBox";
import { EntityTable } from "@/components/UserManagement/staff/EntityTable";
import { useEntityTable } from "@/components/UserManagement/staff/EntityTable/entityTableStore";
import { Box, Grid, TextField, Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import SearchIcon from "@mui/icons-material/Search";

export const Route = createFileRoute("/staff/_staffLayout/user-management/")({
  component: UserManagement,
  meta: () => [{ title: "user Management", path: "/staff/user-management" }],
});

function UserManagement() {
  const { searchText, setSearchText } = useEntityTable();

  return (
    <Box
      sx={{
        padding: "36px 24px",
        width: "100%",
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            value={searchText}
            variant="outlined"
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              margin: 0,
              width: "398px",
            }}
            placeholder="Search Holders by Name"
            InputProps={{
              startAdornment: <SearchIcon htmlColor="#858a8c" />,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <ContentBox
            mainLabel="Generate URL"
            sx={{ width: "100%", height: "fit-content" }}
            contentBoxVariant="secondary"
          >
            <Typography variant="subtitle1">
              Select a Certificate Holder and/or Exemption Holder
            </Typography>
            <EntityTable sx={{ marginTop: "2em" }} />
          </ContentBox>
        </Grid>
      </Grid>
    </Box>
  );
}
