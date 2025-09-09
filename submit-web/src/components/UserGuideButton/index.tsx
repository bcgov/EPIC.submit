import { Typography, Stack } from "@mui/material";
import { AppConfig } from "@/utils/config";
import { BCDesignTokens } from "epic.theme";
import { useMemo } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export const UserGuideButton = () => {
  const version = useMemo(() => {
    const extractVersionFromUrl = (url: string): string | null => {
      // document name must end with vX.X.pdf
      const regex = /v(\d+\.\d+(?:\.\d+)?)(?=\.pdf)/;
      const match = regex.exec(url.toLowerCase());
      return match ? match[1] : null;
    };
    return extractVersionFromUrl(AppConfig.userGuide);
  }, []);

  return (
    <Typography
      variant="body1"
      component="a"
      href={AppConfig.userGuide}  // points to public folder
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        cursor: "pointer",
        color: BCDesignTokens.iconsColorLink,
        textDecoration: "underline",
      }}
    >
      <Stack direction="row" spacing={1} alignItems={"center"}>
        EPIC.submit User Guide {version ? ` v${version}` : ""}
        <OpenInNewIcon
          htmlColor={BCDesignTokens.iconsColorLink}
          fontSize="small"
        />
      </Stack>
    </Typography>
  );
};
