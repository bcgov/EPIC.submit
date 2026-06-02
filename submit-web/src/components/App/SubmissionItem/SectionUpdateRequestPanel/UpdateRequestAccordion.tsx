import React, { ReactNode } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import BorderColorIcon from '@mui/icons-material/BorderColor';
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { BCDesignTokens } from "epic.theme";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";

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
  noteEditingUI?: ReactNode; // PROPONENT: UI for adding/editing notes
  onEditNote?: () => void; // PROPONENT: Callback when edit icon is clicked
  showEditIcon?: boolean; // PROPONENT: Show edit icon in proponent response header
  status?: string; // Update request status to conditionally show proponent note
  isProponentView?: boolean; // PROPONENT: Show notes even when status is OPEN
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
  noteEditingUI,
  onEditNote,
  showEditIcon = false,
  status,
  isProponentView = false,
}) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      sx={{
        border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        background: "#fafafa",
        borderRadius: "6px",
        mb: variant === "previous" ? 0 : 2,
        "&:before": {
          display: "none",
        },
        boxShadow: "none",
      }}
    >
      <AccordionSummary
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
          px: 1.5,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ChevronRightIcon 
              sx={{
                color: "#2d2d2d",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }} 
            />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: "16px",
                color: "#2d2d2d",
                lineHeight: "27px",
              }}
            >
              {itemTypeName}
            </Typography>
          </Box>
          {headerRightContent}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: "white" }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {/* EAO Staff Note */}
          <Box
            sx={{
              backgroundColor: "#F9F9F9",
              p: "12px 12px 12px 15px",
              borderRadius: "4px",
              borderLeft: "3px solid #036",
              display: "flex",
              flexDirection: "column",
              marginBottom: "16px",
              gap: "6px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#036",
                  lineHeight: "19.5px",
                }}
              >
                EAO Staff — {createdBy}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#606060",
                  lineHeight: "18px",
                }}
              >
                {new Date(createdDate).toISOString().split('T')[0]}
              </Typography>
            </Box>
            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                fontSize: "14px",
                lineHeight: "19.5px",
                color: "#2d2d2d",
              }}
            >
              {reason || "No reason provided"}
            </Typography>
          </Box>

          {/* Proponent Response (if exists) - Show to proponents always, show to staff only if status is not OPEN */}
          {note && (isProponentView || status !== UPDATE_REQUEST_STATUS.OPEN.value) && (
            <Box
              sx={{
                backgroundColor: "#F9F9F9",
                p: "12px 12px 12px 15px",
                borderRadius: "4px",
                borderLeft: `3px solid ${BCDesignTokens.themeGold100}`,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: BCDesignTokens.typographyColorPrimary,
                    lineHeight: "19.5px",
                  }}
                >
                  Proponent — {noteUpdatedBy || "Unknown"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: BCDesignTokens.themeGray80,
                    lineHeight: "18px",
                  }}
                >
                  {noteUpdatedAt
                    ? new Date(noteUpdatedAt).toISOString().split('T')[0]
                    : new Date(createdDate).toISOString().split('T')[0]}
                </Typography>
              </Box>
              {/* PROPONENT: Note content with edit icon */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontSize: "13px",
                    lineHeight: "19.5px",
                    color: BCDesignTokens.typographyColorPrimary,
                    flex: 1,
                  }}
                >
                  {note}
                </Typography>
                {showEditIcon && onEditNote && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditNote();
                    }}
                    sx={{
                      padding: "4px",
                      color: BCDesignTokens.themeBlue90,
                      "&:hover": {
                        backgroundColor: "rgba(30, 81, 137, 0.04)",
                      },
                    }}
                  >
                    <BorderColorIcon sx={{ fontSize: "24px" }} />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}

          {/* PROPONENT: Note editing UI (Add/Edit button and text area) */}
          {noteEditingUI}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
