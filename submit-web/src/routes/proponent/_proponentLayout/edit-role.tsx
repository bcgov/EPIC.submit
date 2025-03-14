import { PageGrid } from "@/components/Shared/PageGrid";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import UpdateUserRole from "@/components/UserManagement/entity/EditUserProfile/UpdateUserRoleForm";
import { Grid } from "@mui/material";
import { useUserStore } from "@/components/UserManagement/entity/userStore";

export const Route = createFileRoute('/proponent/_proponentLayout/edit-role')({
  component: UpdateUserRoleFormPage,
  meta: () => [{ title: "Edit Role" }],
})

function UpdateUserRoleFormPage() {
  const { selectedUser } = useUserStore();

  if (!selectedUser) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <UpdateUserRole userData={selectedUser} />
      </Grid>
    </PageGrid>
  );
}
