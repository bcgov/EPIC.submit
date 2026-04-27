import React, { ReactNode } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BorderColorIcon from '@mui/icons-material/BorderColor';

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
              backgroundColor: "#F9F9F9",
              p: "12px 12px 12px 15px",
              borderRadius: "4px",
              borderLeft: "3px solid #003366",
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
                  fontFamily: "BCSans, sans-serif",
                  color: "#003366",
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
                  fontFamily: "BCSans, sans-serif",
                }}
              >
                {new Date(createdDate).toISOString().split('T')[0]}
              </Typography>
            </Box>
            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                fontSize: "13px",
                lineHeight: "19.5px",
                color: "#2D2D2D",
                fontFamily: "BCSans, sans-serif",
              }}
            >
              {reason || "No reason provided"}
            </Typography>
          </Box>

          {/* Proponent Response (if exists) */}
          {note && (
            <Box
              sx={{
                backgroundColor: "#F9F9F9",
                p: "12px 12px 12px 15px",
                borderRadius: "4px",
                borderLeft: "3px solid #FCBA19",
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
                    color: "#2D2D2D",
                    fontFamily: "BCSans, sans-serif",
                    lineHeight: "19.5px",
                  }}
                >
                  Proponent — {noteUpdatedBy || "Unknown"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#606060",
                    lineHeight: "18px",
                    fontFamily: "BCSans, sans-serif",
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
                    color: "#2D2D2D",
                    fontFamily: "BCSans, sans-serif",
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
                      color: "#1E5189",
                      "&:hover": {
                        backgroundColor: "rgba(30, 81, 137, 0.04)",
                      },
                    }}
                  >
                    <BorderColorIcon sx={{ fontSize: "16px" }} />
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
