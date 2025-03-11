import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { DataSkeleton, UserTable } from "@/components/UserManagement/entity";
import { useGetUserByAccountId } from "@/hooks/api/useAccounts";
import { useAccount } from "@/store/accountStore";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Else, If, Then } from "react-if";

export const Route = createFileRoute(
  "/proponent/_proponentLayout/user-management/"
)({
  component: UsersPage,
  meta: () => [{ title: "User Management" }],
});

function UsersPage() {
  const { accountId } = useAccount();
  const {
    data: users,
    isPending: isUsersLoading,
    isError: isUsersError,
  } = useGetUserByAccountId({
    accountId,
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
