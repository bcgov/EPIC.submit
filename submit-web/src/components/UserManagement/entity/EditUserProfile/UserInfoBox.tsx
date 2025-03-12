import { Grid, IconButton, Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { AccountUserWithRole } from "@/models/AccountUser";
import { ReactNode } from "@tanstack/react-router";
import { roleDetails } from "@/models/Role";
import EditIcon from "@mui/icons-material/Edit";

interface UserInfoBoxProps {
  userData: AccountUserWithRole;
  showEdit: boolean;
}

type InfoBoxItemProps = {
  label?: string;
  value?: ReactNode;
  showEdit?: boolean;
  onEdit?: () => void;
};
const InfoBoxItem = ({ label = "", value = "", showEdit = false, onEdit }: InfoBoxItemProps) => {
  return (
    <Grid container direction="row" alignItems="flex-start" spacing={1}>
      <Grid item xs={4}>  
        <Typography color={BCDesignTokens.themeGray70}>{label}:</Typography>
      </Grid>
      <Grid item xs={8} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography color="inherit">{value}</Typography>
        {showEdit && (
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{ padding: 0, marginLeft: 3, display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <EditIcon htmlColor={BCDesignTokens.iconsColorLink} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 400, color: BCDesignTokens.iconsColorLink }}>
                  Edit Access
              </Typography>
          </IconButton>
        )}
      </Grid>
    </Grid>
  );
};

const UserInfoBox = ({ userData, showEdit }: UserInfoBoxProps) => {
  const roleNames = userData.roles?.map((role) => roleDetails[role.role_name]?.label).join(", ");

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
          <InfoBoxItem
            label={"Current Access Level"}
            value={roleNames}
            showEdit={showEdit}
          />
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
