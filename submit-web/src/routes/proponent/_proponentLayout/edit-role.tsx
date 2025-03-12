import { useSearch } from "@tanstack/react-router";
import { PageGrid } from "@/components/Shared/PageGrid";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import EditRole from "@/components/UserManagement/entity/EditUserProfile/EditRole";
import { Grid } from "@mui/material";

export const Route = createFileRoute("/proponent/_proponentLayout/edit-role")({
  component: ProfileEditPage,
  meta: () => [{ title: "Edit Profile" }],
  validateSearch: (search) => ({
    user: search.user as string | undefined,
  }),
});

function ProfileEditPage() {
  const { user } = useSearch({ from: "/proponent/_proponentLayout/edit-role" });
  const parsedUser = user ? JSON.parse(user) : null;

  if (!parsedUser) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <EditRole user={parsedUser} />
      </Grid>
    </PageGrid>
  );
}
