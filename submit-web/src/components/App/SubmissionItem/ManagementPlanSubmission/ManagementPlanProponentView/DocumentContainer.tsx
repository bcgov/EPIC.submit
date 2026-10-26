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
      sx={{
        border: `1px solid #D6EBFF`,
        padding: BCDesignTokens.layoutPaddingSmall,
        mb: BCDesignTokens.layoutMarginSmall,
      }}>
      <Grid
        container
        size={11}
        sx={{
          alignItems: "center",
          justifyContent: "flex-start"
        }}>
        <Box
          sx={{
            mr: BCDesignTokens.layoutMarginLarge,
          }}
        >
          <DocumentIcon />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "70%",
            mr: BCDesignTokens.layoutMarginSmall
          }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: BCDesignTokens.typographyFontWeightsBold,
              color: "#222",
              mr: BCDesignTokens.layoutMarginSmall
            }}>
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
      <Grid size={1}>
        <Button variant="text">Remove</Button>
      </Grid>
    </Grid>
  );
};

export default DocumentContainer;
