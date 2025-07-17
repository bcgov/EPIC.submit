import { PageGrid } from "@/components/Shared/PageGrid";
import { hasPermission } from "@/components/Shared/PermissionGate/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { DataSkeleton, UserTable } from "@/components/UserManagement/entity";
import { useGetUserByAccountId } from "@/hooks/api/useAccounts";
import { ACCOUNT_USER_PERMISSIONS, USER_MANAGEMENT_ROLE } from "@/models/Role";
import { useAccount } from "@/store/accountStore";
import { Grid } from "@mui/material";
import {
  createFileRoute,
  Navigate,
  notFound,
  rootRouteId,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Else, If, Then } from "react-if";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/"
)({
  component: UsersPage,
  meta: () => [{ title: "User Management" }],
  beforeLoad: async ({ context: { account } }) => {
    console.log("account", account);
    if (
      !account.isLoading &&
      !hasPermission({
        scopes: [ACCOUNT_USER_PERMISSIONS.INVITE_USERS],
        permissions: account?.roles || [],
      })
    ) {
      throw notFound({
        routeId: rootRouteId,
      });
    }
  },
});

function UsersPage() {
  const { accountId } = useAccount();
  const {
    data: users,
    isPending: isUsersLoading,
    isError: isUsersError,
  } = useGetUserByAccountId({
    accountId,
    includeInvitees: true,
    includeRoles: true,
  });

  useEffect(() => {
    if (isUsersError) {
      notify.error("Failed to load documents");
    }
  }, [isUsersError]);

  if (isUsersError) {
    return <Navigate to={"/error"} />;
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
