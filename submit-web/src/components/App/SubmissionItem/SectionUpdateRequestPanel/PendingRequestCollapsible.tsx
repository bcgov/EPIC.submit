import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Link,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PendingRequest } from "./types";
import { BCDesignTokens } from "epic.theme";

interface PendingRequestCollapsibleProps {
  request: PendingRequest;
  onRemove: () => void;
  onUpdateNote: (note: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export const PendingRequestCollapsible: React.FC<
  PendingRequestCollapsibleProps
> = ({ request, onRemove, onUpdateNote, expanded, onToggle }) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      sx={{
        border: "1px solid #f5a623",
        background: "#fffdf5",
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
          flexDirection: "row-reverse",
          "& .MuiAccordionSummary-expandIconWrapper": {
            marginRight: 1,
          },
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
        <Link
          component="button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove();
          }}
          sx={{
            color: BCDesignTokens.themeBlue90,
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Remove
        </Link>
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
            This note will be shared with the proponent.
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={request.reason}
            onChange={(e) => onUpdateNote(e.target.value)}
            placeholder={`Describe what needs to be updated or added for ${request.itemTypeName}...`}
            variant="outlined"
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
