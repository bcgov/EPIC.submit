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

  const handleUserGuideClick = () => {
    // open new tab with user guide
    window.open(AppConfig.userGuide, "_blank", "noopener,noreferrer");
  };

  return (
    <Typography
      variant="body1"
      sx={{
        cursor: "pointer",
        color: BCDesignTokens.iconsColorLink,
        textDecoration: "underline",
      }}
      onClick={handleUserGuideClick}
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
