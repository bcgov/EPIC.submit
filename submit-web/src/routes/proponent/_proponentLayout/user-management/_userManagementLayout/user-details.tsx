import { PageGrid } from "@/components/Shared/PageGrid";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import UserDetails from "@/components/UserManagement/entity/EditUserProfile/UserDetails";
import { Grid } from "@mui/material";
import { useUserStore } from "@/components/UserManagement/entity/userStore";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/_userManagementLayout/user-details"
)({
  component: ProfileEditPage,
  loader: () => {
    // Get the selected user from the store
    const selectedUser = useUserStore.getState().selectedUser;
    if (!selectedUser) {
      throw new Error("No user selected");
    }
    return { selectedUser };
  },
  meta: ({ loaderData }) => [
    {
      title: `${loaderData.selectedUser.first_name} ${loaderData.selectedUser.last_name}`,
      path: "/proponent/user-management/user-details",
    },
  ],
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
