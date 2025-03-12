import { PageGrid } from "@/components/Shared/PageGrid";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import UserDetails from "@/components/UserManagement/entity/EditUserProfile/UserDetails";
import { Grid } from "@mui/material";
import { useUserStore } from "@/components/UserManagement/entity/userStore";

export const Route = createFileRoute("/proponent/_proponentLayout/user-details")({
  component: ProfileEditPage,
  meta: () => [{ title: "User Details" }],
});

function ProfileEditPage() {
  const { selectedUser } = useUserStore();

  if (!selectedUser) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <UserDetails user={selectedUser} />
      </Grid>
    </PageGrid>
  );
}
