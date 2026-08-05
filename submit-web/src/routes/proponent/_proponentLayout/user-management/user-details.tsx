import { PageGrid } from "@/components/Shared/PageGrid";
import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import UserDetails from "@/components/App/UserManagement/entity/EditUserProfile/UserDetails";
import { Grid } from "@mui/material";
import { useUserStore } from "@/components/App/UserManagement/entity/userStore";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/user-details",
)({
  component: ProfileEditPage,
  loader: () => {
    const selectedUser = useUserStore.getState().selectedUser;
    if (!selectedUser) {
      throw redirect({ to: "/proponent/user-management" });
    }
    return { selectedUser };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "User Management", path: "/proponent/user-management" },
      {
        title: `${loaderData?.selectedUser.first_name} ${loaderData?.selectedUser.last_name}`,
        path: "/proponent/user-management/user-details",
      },
    ],
  }),
});

function ProfileEditPage() {
  const { selectedUser } = useUserStore();

  if (!selectedUser) {
    return <Navigate to={"/proponent/user-management"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <UserDetails user={selectedUser} />
      </Grid>
    </PageGrid>
  );
}
