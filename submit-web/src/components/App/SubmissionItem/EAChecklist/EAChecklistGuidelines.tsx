import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { eaChecklistDocURL } from "./constants";

export const EAChecklistGuidelines = () => {
  return (
    <Box>
      <Typography variant="body2">
        The Early Engagement Checklist helps you confirm you have completed the key early engagement activities 
        before submitting your Initial Project Description and Engagement Plan. Uploading a completed copy is optional, 
        but it helps the EAO understand the engagement you have carried out. You can find the checklist in the {" "}
        <Link
          href={eaChecklistDocURL}
          underline="always"
          sx={{ color: BCDesignTokens.themeBlue100 }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Early Engagement Guide (PDF)
        </Link>.
      </Typography>
    </Box>
  );
};
