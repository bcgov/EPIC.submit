import { PageGrid } from "@/components/Shared/PageGrid";
import NewUserForm from "@/components/UserManagement/entity/NewUser/NewUserForm";
import { Grid } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/new-user",
)({
  meta: () => [{ title: "User Management" }],
  component: () => (
    <PageGrid>
      <Grid item xs={12}>
        <NewUserForm />
      </Grid>
    </PageGrid>
  ),
});
