import { useEffect, useMemo, useState } from "react";
import { TableBox } from "@/components/Shared/Layouts/TableBox";
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { AccountUserWithRole } from "@/models/AccountUser";
import { BCDesignTokens } from "epic.theme";
import UserInfoBox from "./UserInfoBox";
import UserStatusChip from "@/components/App/UserStatusChip";
import { useAccount } from "@/store/accountStore";
import { ACCOUNT_USER_PERMISSIONS, USER_MANAGEMENT_ROLE } from "@/models/Role";
import { UserPackageStatus } from "@/components/App/UserStatusChip";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { EditAccessLevelModal } from "./EditAccessLevelModal";
import { hasPermission } from "@/components/Shared/PermissionGate/utils";
import { AccessHistoryTable } from "./AccessHistoryTable";
import { useUserEffectiveRole } from "@/hooks/useUserEffectiveRole";
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";

interface UserDetailsProps {
  user: AccountUserWithRole;
}

function UserDetails({ user }: UserDetailsProps) {
  const [userData, setUserData] = useState(user);
  const account = useAccount();
  const isNotSelf = account.userId !== user.user_id;
  const canManageUsers = useMemo(
    () =>
      hasPermission({
        scopes: [ACCOUNT_USER_PERMISSIONS.INVITE_USERS],
        permissions: account?.roles || [],
      }),
    [account?.roles],
  );
  const isAccountAdmin =
    account.userManagementRoles?.some(
      (r) => r.role_name === USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
    ) ?? false;
  const { data: accountProjects } = useGetAccountProjectsByAccount({
    accountId: account.accountId,
  });
  const targetEffectiveRole = useUserEffectiveRole(userData.roles, accountProjects?.length);
  const targetIsAccountAdmin =
    targetEffectiveRole.role_name === USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN;
  // Project Admins cannot edit Account Admin users
  const showEdit =
    isNotSelf && canManageUsers && (isAccountAdmin || !targetIsAccountAdmin);
  const REVOKED_STATUS: UserPackageStatus = "ACCESS_REVOKED";
  const isRevoked = userData.status === REVOKED_STATUS;
  const { setOpen } = useModal();

  const handleEditAccessLevel = () => {
    setOpen(
      <EditAccessLevelModal
        userData={userData}
        onSuccess={(updatedUser) => setUserData(updatedUser)}
        isCurrentUserAccountAdmin={isAccountAdmin}
      />,
    );
  };

  useEffect(() => {
    setUserData(user);
  }, [user]);

  return (
    <TableBox mainLabel={"User Management"}>
      <Paper
        sx={{
          maxWidth: "1448px",
          minHeight: "500px",
          border: `1px solid ${BCDesignTokens.themeGray40}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "auto",
            padding: "12px 20px",
          }}
        >
          <Grid container direction="row" alignItems="center" spacing={1}>
            <Grid item xs={10}>
              <Typography variant="h5" sx={{ fontWeight: 400 }}>
                {userData.full_name}
              </Typography>
            </Grid>
            <Grid
              item
              xs={2}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Typography color={BCDesignTokens.themeGray70}>
                Status:
              </Typography>
              <UserStatusChip status={userData.status} />
            </Grid>
            {(showEdit || isRevoked) && (
              <Grid
                item
                xs={12}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1,
                  gap: 2,
                }}
              >
                {isRevoked && (
                  <Box
                    sx={{
                      display: "flex",
                      height: "48px",
                      padding: "8px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                      borderRadius: "4px",
                      border: "1px solid #F8BB47",
                      background: "#FEF1D8",
                    }}
                  >
                    <Typography variant="body2" color="black">
                      This User's access has been revoked. You can restore
                      access by clicking the Edit Access Level button and
                      reassigning a role.
                    </Typography>
                  </Box>
                )}
                {showEdit && (
                  <Button
                    variant="outlined"
                    onClick={handleEditAccessLevel}
                    sx={{
                      height: "40px",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      border: "1px solid #353433",
                      background: "#FFF",
                      color: "#353433",
                      textTransform: "none",
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                      ml: "auto",
                      "&:hover": {
                        border: "1px solid #353433",
                        background: "#F5F5F5",
                      },
                    }}
                  >
                    Edit Access Level
                  </Button>
                )}
              </Grid>
            )}
          </Grid>
        </Box>
        <Box sx={{ pt: "16px" }}>
          <UserInfoBox userData={userData} showEdit={false} />
        </Box>
        
        <AccessHistoryTable accountUserId={userData.id} />
      </Paper>
    </TableBox>
  );
}

export default UserDetails;
