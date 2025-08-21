import { PageGrid } from "@/components/Shared/PageGrid";
import { hasPermission } from "@/components/Shared/PermissionGate/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { DataSkeleton, UserTable } from "@/components/UserManagement/entity";
import { useGetUserByAccountId } from "@/hooks/api/useAccounts";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import { useAccount } from "@/store/accountStore";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Else, If, Then } from "react-if";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/",
)({
  component: UsersPage,
  meta: () => [{ title: "User Management" }],
  beforeLoad: async ({ context: { account } }) => {
    if (
      !account.isLoading &&
      !hasPermission({
        scopes: [ACCOUNT_USER_PERMISSIONS.INVITE_USERS],
        permissions: account?.roles || [],
      })
    ) {
      throw notFound();
    }
  },
});

function UsersPage() {
  const { accountId, roles } = useAccount();
  const {
    data: users,
    isPending: isUsersLoading,
    isError: isUsersError,
  } = useGetUserByAccountId({
    accountId,
    includeInvitees: true,
    includeRoles: true,
  });

  const hasInviteUsersPermission = useMemo(() => {
    return hasPermission({
      scopes: [ACCOUNT_USER_PERMISSIONS.INVITE_USERS],
      permissions: roles || [],
    });
  }, [roles]);

  useEffect(() => {
    if (isUsersError) {
      notify.error("Failed to load documents");
    }
  }, [isUsersError]);

  if (isUsersError) {
    return <Navigate to={"/error"} />;
  }

  if (!hasInviteUsersPermission) {
    return <Navigate to={"/not-found"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isUsersLoading}>
          <Then>
            <DataSkeleton />
          </Then>
          <Else>
            <UserTable users={users || []} />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
