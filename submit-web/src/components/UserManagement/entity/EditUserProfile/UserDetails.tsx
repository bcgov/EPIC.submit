import { useEffect, useState } from "react";
import { TableBox } from "../../../Shared/TableBox";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { AccountUserWithRole } from "@/models/AccountUser";
import { BCDesignTokens } from "epic.theme";
import UserInfoBox from "./UserInfoBox";
import UserStatusChip from "../../../../components/UserStatusChip";

interface UserDetailsProps {
  user: AccountUserWithRole;
}

function UserDetails({ user }: UserDetailsProps) {
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  return (
    <TableBox mainLabel={"User Management"} >
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
                    <Typography variant="h2" sx={{ fontWeight: 400 }}>
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
                    <Typography color={BCDesignTokens.themeGray70}>Status:</Typography>
                    <UserStatusChip status={userData.status} />
                </Grid>
            </Grid>
            </Box>
            <UserInfoBox userData={userData} showEdit={true} />
        </Paper>
    </TableBox>
  );
}

export default UserDetails;
