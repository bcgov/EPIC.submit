import { Grid, Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { AccountUserWithRole } from "@/models/AccountUser";
import { ReactNode } from "@tanstack/react-router";

interface UserInfoBoxProps {
  userData: AccountUserWithRole;
}

type InfoBoxItemProps = {
  label?: string;
  value?: ReactNode;
};
const InfoBoxItem = ({ label = "", value = "" }: InfoBoxItemProps) => {
  return (
    <Grid container direction="row" alignItems="flex-start" spacing={1}>
      <Grid item xs={4}>  
        <Typography color={BCDesignTokens.themeGray70}>{label}:</Typography>
      </Grid>
      <Grid item xs={8}>  
        <Typography color="inherit">{value}</Typography>
      </Grid>
    </Grid>
  );
};

const UserInfoBox = ({ userData }: UserInfoBoxProps) => {
  const roleNames = userData.roles?.map((role) => role.role_name).join(", ");

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "auto",
        padding: "12px 20px",
        border: `1px solid ${BCDesignTokens.themeGray40}`,
        borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
        mx: 2,
      }}
    >
      <Grid container spacing={2} columns={2}>
        <Grid item xs={1} sx={{ fontWeight: "bold" }}>
          <InfoBoxItem label={"Current Access Level"} value={roleNames} />
        </Grid>
        <Grid item xs={1}>
          <InfoBoxItem label={"Email"} value={userData.work_email_address} />
        </Grid>
        <Grid item xs={1} sx={{ fontWeight: "bold" }}>
          <InfoBoxItem label={"Position/Role"} value={userData.position} />
        </Grid>
        <Grid item xs={1}>
          <InfoBoxItem label={"Phone"} value={userData.work_contact_number} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserInfoBox;
