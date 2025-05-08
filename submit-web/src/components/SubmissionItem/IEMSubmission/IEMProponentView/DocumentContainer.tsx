import { Box, Button, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DocumentIcon from "./DocumentIcon";
import { DocumentSubmission } from "@/models/Submission";

interface DocumentContainerProps {
  document: DocumentSubmission;
}

const DocumentContainer: React.FC<DocumentContainerProps> = ({ document }) => {
  return (
    <Grid
      container
      item
      sx={{
        border: `1px solid #D6EBFF`,
        padding: BCDesignTokens.layoutPaddingSmall,
        mb: BCDesignTokens.layoutMarginSmall,
      }}
    >
      <Grid
        container
        item
        xs={11}
        alignItems={"center"}
        justifyContent={"flex-start"}
      >
        <Box
          sx={{
            mr: BCDesignTokens.layoutMarginLarge,
          }}
        >
          <DocumentIcon />
        </Box>
        <Box
          display={"flex"}
          flexDirection={"row"}
          width={"70%"}
          mr={BCDesignTokens.layoutMarginSmall}
        >
          <Typography
            variant="body1"
            fontWeight={BCDesignTokens.typographyFontWeightsBold}
            sx={{ color: "#222", mr: BCDesignTokens.layoutMarginSmall }}
          >
            {document.name}
          </Typography>{" "}
          <CheckRoundedIcon
            sx={{
              color: "#2E8540",
              background: "#C2EACA",
              borderRadius: BCDesignTokens.layoutPaddingLarge,
            }}
          />
        </Box>
      </Grid>
      <Grid item xs={1}>
        <Button variant="text">Remove</Button>
      </Grid>
    </Grid>
  );
};

export default DocumentContainer;
