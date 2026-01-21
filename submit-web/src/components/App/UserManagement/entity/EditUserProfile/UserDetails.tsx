import { useEffect, useState } from "react";
import { TableBox } from "@/components/Shared/TableBox";
import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { AccountUserWithRole } from "@/models/AccountUser";
import { BCDesignTokens } from "epic.theme";
import UserInfoBox from "./UserInfoBox";
import UserStatusChip from "@/components/App/UserStatusChip";
import { useAccount } from "@/store/accountStore";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "@tanstack/react-router";
import { UserPackageStatus } from "@/components/App/UserStatusChip";

interface UserDetailsProps {
  user: AccountUserWithRole;
}

function UserDetails({ user }: UserDetailsProps) {
  const [userData, setUserData] = useState(user);
  const account = useAccount();
  const showEdit = account.userId !== user.user_id;
  const INACTIVE_STATUS: UserPackageStatus = "INACTIVE";
  const isContributor =
    userData.role?.role_name ===
    USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR;
  const isInactive = userData.status === INACTIVE_STATUS;
  const navigate = useNavigate();
  const handleEditClick = () => {
    navigate({ to: "/proponent/user-management/edit-role" });
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
          </Grid>
        </Box>
        <UserInfoBox userData={userData} showEdit={showEdit} />
        {isInactive ? (
          <Box
            sx={{
              background: BCDesignTokens.supportSurfaceColorSuccess,
              border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
              borderRadius: 1,
              mt: 3,
              mx: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                padding: "8px",
              }}
            >
              <Typography variant="body1" color="black">
                This user has been successfully deactivated.
              </Typography>
            </Box>
          </Box>
        ) : (
          isContributor &&
          showEdit && (
            <Container
              maxWidth="sm"
              sx={{
                pb: BCDesignTokens.layoutPaddingSmall,
                alignSelf: "flex-start",
                m: 0,
                marginTop: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: BCDesignTokens.themeBlue100,
                    fontWeight: 700,
                  }}
                >
                  Current Access
                </Typography>

                <IconButton
                  size="small"
                  onClick={handleEditClick}
                  sx={{
                    padding: 0,
                    marginLeft: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <EditIcon
                    htmlColor={BCDesignTokens.iconsColorLink}
                    fontSize="small"
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 400,
                      color: BCDesignTokens.iconsColorLink,
                    }}
                  >
                    Edit Access
                  </Typography>
                </IconButton>
              </Box>
              <Divider
                sx={{
                  backgroundColor: BCDesignTokens.themeGold100,
                  height: 1,
                  mb: 2,
                }}
              />
              {Array.isArray(userData.role?.package_names) &&
                userData.role.package_names.length > 0 && (
                  <ul style={{ paddingLeft: "1.25rem", marginTop: 4 }}>
                    {userData.role.package_names.map((name, index) => (
                      <li key={index}>
                        <Typography variant="body2" color="inherit">
                          {name}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                )}
            </Container>
          )
        )}
      </Paper>
    </TableBox>
  );
}

export default UserDetails;
