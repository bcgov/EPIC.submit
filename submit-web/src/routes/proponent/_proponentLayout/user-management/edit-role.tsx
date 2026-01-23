import { PageGrid } from "@/components/Shared/PageGrid";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import UpdateUserRole from "@/components/App/UserManagement/entity/EditUserProfile/UpdateUserRoleForm";
import { Grid } from "@mui/material";
import { useUserStore } from "@/components/App/UserManagement/entity/userStore";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/edit-role",
)({
  component: UpdateUserRoleFormPage,
  loader: () => {
    // Get the selected user from the store
    const selectedUser = useUserStore.getState().selectedUser;
    if (!selectedUser) {
      throw new Error("No user selected");
    }
    return { selectedUser };
  },
  meta: ({ loaderData }) => [
    { title: "User Management", path: "/proponent/user-management" },
    {
      title: `${loaderData.selectedUser.first_name} ${loaderData.selectedUser.last_name}`,
      path: "/proponent/user-management/user-details",
    },
  ],
});

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
