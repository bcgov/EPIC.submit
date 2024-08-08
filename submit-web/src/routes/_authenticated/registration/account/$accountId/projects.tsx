import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid, Typography } from "@mui/material";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/registration/account/$accountId/projects",
)({
  component: AddAccountProjects,
});

function AddAccountProjects() {
  const { accountId } = useParams({ strict: false });
  const navigate = useNavigate();

  return (
    <PageGrid>
      <Grid item xs={12}>
        <Typography variant="h3">Project Account</Typography>
      </Grid>
    </PageGrid>
  );
}
