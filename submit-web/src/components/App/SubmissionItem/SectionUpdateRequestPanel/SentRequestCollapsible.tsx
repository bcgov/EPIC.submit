import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SentRequest } from "./types";
import { BCDesignTokens } from "epic.theme";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";

interface SentRequestCollapsibleProps {
  request: SentRequest;
  expanded: boolean;
  onToggle: () => void;
}

export const SentRequestCollapsible: React.FC<SentRequestCollapsibleProps> = ({
  request,
  expanded,
  onToggle,
}) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      sx={{
        border: "1px solid #e0e0e0",
        background: "#fafafa",
        borderRadius: "4px",
        mb: 2,
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          "& .MuiAccordionSummary-content": {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {request.itemTypeName}
        </Typography>
        <Box>
          {request.status === UPDATE_REQUEST_STATUS.OPEN.value && (
            <Chip
              label="Requested"
              size="small"
              sx={{
                backgroundColor: "#fcf8e3",
                border: "1px solid #f5a623",
                color: BCDesignTokens.typographyColorPrimary,
                fontSize: "12px",
                height: "24px",
                fontWeight: 400,
              }}
            />
          )}
          {request.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value && (
            <Chip
              label="Pending Review"
              size="small"
              sx={{
                backgroundColor: "#e3f2fd",
                border: "1px solid #2196f3",
                color: BCDesignTokens.typographyColorPrimary,
                fontSize: "12px",
                height: "24px",
                fontWeight: 400,
              }}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            Request Note
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: BCDesignTokens.typographyColorSecondary,
              mb: 1,
            }}
          >
            Created by {request.createdBy} on{" "}
            {new Date(request.createdDate).toLocaleDateString()}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              p: 2,
              background: "white",
              borderRadius: "4px",
              border: "1px solid #e0e0e0",
            }}
          >
            {request.note || "No note provided"}
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
