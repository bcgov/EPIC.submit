import React from "react";
import {
  Box,
  Typography,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { UpdateRequest } from "@/models/UpdateRequest";

type PreviousRequestAccordionProps = Readonly<{
  request: UpdateRequest;
  expanded: boolean;
  onToggle: () => void;
}>;

export const PreviousRequestAccordion: React.FC<
  PreviousRequestAccordionProps
> = ({ request, expanded, onToggle }) => {
  const formattedDate = request.created_date
    ? new Date(request.created_date).toLocaleDateString()
    : "";

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          p: 1.5,
          backgroundColor: "#f9f9f9",
          borderRadius: "4px",
          border: "1px solid #e0e0e0",
        }}
        onClick={onToggle}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#2d2d2d",
          }}
        >
          Geospatial Information
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            p: 2,
            backgroundColor: "white",
            border: "1px solid #e0e0e0",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              borderLeft: "4px solid #606060",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#2d2d2d",
                }}
              >
                EAO Staff — {request.created_by || "Unknown"}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#606060",
                }}
              >
                {formattedDate}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: "14px",
                color: "#2d2d2d",
                lineHeight: 1.5,
              }}
            >
              {request.reason || "No reason provided"}
            </Typography>
          </Box>

          {request.note && (
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#2d2d2d",
                  mb: 1,
                }}
              >
                Your Response
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#2d2d2d",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {request.note}
                </Typography>
                {request.note_updated_at && (
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#606060",
                      mt: 1,
                    }}
                  >
                    Submitted:{" "}
                    {new Date(request.note_updated_at).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
