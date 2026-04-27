import React, { ReactNode } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BCDesignTokens } from "epic.theme";

interface UpdateRequestAccordionProps {
  itemTypeName: string;
  expanded: boolean;
  onToggle: () => void;
  headerRightContent?: ReactNode;
  reason: string;
  createdBy: string;
  createdDate: string;
  note?: string;
  noteUpdatedBy?: string;
  noteUpdatedAt?: string;
  variant?: "active" | "previous";
}

export const UpdateRequestAccordion: React.FC<UpdateRequestAccordionProps> = ({
  itemTypeName,
  expanded,
  onToggle,
  headerRightContent,
  reason,
  createdBy,
  createdDate,
  note,
  noteUpdatedBy,
  noteUpdatedAt,
  variant = "active",
}) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      sx={{
        border: "1px solid #D8D8D8",
        background: "#FAFAFA",
        borderRadius: "6px",
        mb: variant === "previous" ? 0 : 2,
        "&:before": {
          display: "none",
        },
        boxShadow: "none",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: "16px", color: "#606060" }} />}
        sx={{
          minHeight: "46px",
          height: "46px",
          "&.Mui-expanded": {
            minHeight: "46px",
          },
          "& .MuiAccordionSummary-content": {
            margin: 0,
            "&.Mui-expanded": {
              margin: 0,
            },
          },
          px: 1.75,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: "16px",
                color: "#2D2D2D",
                lineHeight: "27px",
              }}
            >
              {itemTypeName}
            </Typography>
          </Box>
          {headerRightContent}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* EAO Staff Note */}
          <Box
            sx={{
              backgroundColor: "#F5F5F5",
              p: 2,
              borderRadius: "4px",
              borderLeft: "4px solid #003366",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: "14px",
                  fontFamily: "BCSans, sans-serif",
                  color: "#003366",
                }}
              >
                EAO Staff — {createdBy}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "12px",
                  color: BCDesignTokens.typographyColorSecondary,
                }}
              >
                {new Date(createdDate).toISOString().split('T')[0]}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {reason || "No reason provided"}
            </Typography>
          </Box>

          {/* Proponent Response (if exists) */}
          {note && (
            <Box
              sx={{
                backgroundColor: "#FFFBF0",
                p: 2,
                borderRadius: "4px",
                borderLeft: "4px solid #FCBA19",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#003366",
                    fontFamily: "BCSans, sans-serif",
                  }}
                >
                  Proponent — {noteUpdatedBy || "Unknown"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "12px",
                    color: BCDesignTokens.typographyColorSecondary,
                  }}
                >
                  {noteUpdatedAt
                    ? new Date(noteUpdatedAt).toISOString().split('T')[0]
                    : new Date(createdDate).toISOString().split('T')[0]}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {note}
              </Typography>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
