import { Typography, Box } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const RegistrationPageTitle = ({
  mainTitle,
  subTitle,
}: {
  mainTitle: string;
  subTitle: React.ReactNode;
}) => {
  return (
    <Box mb={3}>
      <Box
        sx={{
          width: 32,
          height: 4,
          backgroundColor: BCDesignTokens.themePrimaryGold,
          borderRadius: 2,
        }}
        data-testid="registration-title-yellow-bar"
      />
      <Typography variant="h5" mb={1.5}>
        {mainTitle}
      </Typography>
      <Typography variant="body1">{subTitle}</Typography>
    </Box>
  );
};
