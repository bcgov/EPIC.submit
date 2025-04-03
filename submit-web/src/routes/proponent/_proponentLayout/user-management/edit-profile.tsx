import { PageGrid } from "@/components/Shared/PageGrid";
import { useEffect } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import ProfileEditForm from "@/components/UserManagement/entity/EditUserProfile/ProfileEditForm";
import { useAccountGetUserByGuid } from "@/hooks/api/useAccountUsers";
import { useAuth } from "react-oidc-context";
import { PageLoader } from "@/components/Shared/PageLoader";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { Grid } from "@mui/material";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/edit-profile"
)({
  component: ProfileEditPage,
  meta: () => [
    { title: "User Management", path: "/proponent/user-management" },
    { title: "Edit Profile", path: "/proponent/user-management/edit-profile" },
  ],
});

function ProfileEditPage() {
  const { user } = useAuth();
  const {
    data: account_user,
    isPending: isUserAccountLoading,
    isError: isUsersError,
  } = useAccountGetUserByGuid({
    guid: user?.profile.sub,
  });

  useEffect(() => {
    if (isUsersError) {
      notify.error("Failed to load user profile");
    }
  }, [isUsersError]);

  if (isUsersError) {
    return <Navigate to={"/error"} />;
  }

  if (isUserAccountLoading || !user) {
    return <PageLoader />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ProfileEditForm user={account_user} guid={user.profile.sub} />
      </Grid>
    </PageGrid>
  );
}
