import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { geoDocURL } from "./constants";

export const GeoSpatialGuidelines = ({ isPreview }: { isPreview?: boolean }) => {
  return (
    <Box>
      <Typography variant="body2">
        Please review the EAO’s{" "}
        <Link
          href={geoDocURL}
          underline="always"
          sx={{ color: BCDesignTokens.themeBlue100 }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Spatial Data Submission Guideline
        </Link>{" "}
        (PDF, 5.1MB) to understand GIS files requirements. {" "}
        {isPreview ? `Please review this document and re-upload.` : `You can also find file templates in this document to get you started.`}
      </Typography>
    </Box>
  );
};
