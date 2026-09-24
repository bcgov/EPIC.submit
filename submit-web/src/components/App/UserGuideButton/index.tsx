import { Typography, Stack } from "@mui/material";
import { AppConfig } from "@/utils/config";
import { useMemo } from "react";
import DescriptionIcon from "@mui/icons-material/Description";

const GUIDE_LINK_COLOR = "#1A5A96";
const GUIDE_ICON_COLOR = "#003366";

export const UserGuideButton = () => {
  const version = useMemo(() => {
    // Prefer an explicitly configured version so the label can be bumped
    // (e.g. to v2.0) without renaming the guide file / changing its URL.
    if (AppConfig.userGuideVersion) {
      return AppConfig.userGuideVersion;
    }
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
      href={AppConfig.userGuide} // points to public folder
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        cursor: "pointer",
        color: GUIDE_LINK_COLOR,
        fontSize: "18px",
        fontWeight: 400,
        lineHeight: "30.608px",
        textDecoration: "underline",
        textUnderlinePosition: "from-font",
      }}
    >
      <Stack direction="row" spacing={1} alignItems={"center"}>
        <DescriptionIcon
          htmlColor={GUIDE_ICON_COLOR}
          sx={{ width: 42, height: 42 }}
        />
        <span>
          Download the EPIC.submit User Guide{version ? ` v${version}` : ""}
        </span>
      </Stack>
    </Typography>
  );
};
