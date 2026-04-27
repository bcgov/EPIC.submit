import React, { useState } from "react";
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { UpdateRequest } from "@/models/UpdateRequest";

type ProponentRequestAccordionProps = Readonly<{
  request: UpdateRequest;
  expanded: boolean;
  onToggle: () => void;
  onSaveNote: (note: string) => void;
  isLoading?: boolean;
}>;

export const ProponentRequestAccordion: React.FC<
  ProponentRequestAccordionProps
> = ({ request, expanded, onToggle, onSaveNote, isLoading = false }) => {
  const [noteText, setNoteText] = useState(request.note || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSaveNote(noteText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNoteText(request.note || "");
    setIsEditing(false);
  };

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
          backgroundColor: "#f1f8fe",
          borderRadius: "4px",
          border: "1px solid #d8eafd",
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
            border: "1px solid #d8eafd",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
          }}
        >
          {/* EAO Staff Comment */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              borderLeft: "4px solid #255a90",
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

          {/* Proponent Response Section */}
          <Box>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#2d2d2d",
                mb: 1,
              }}
            >
              Your Response (Optional)
            </Typography>

            {isEditing ? (
              <>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note for the EAO (max 500 characters)"
                  inputProps={{ maxLength: 500 }}
                  sx={{ mb: 1 }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#606060",
                    }}
                  >
                    {noteText.length}/500 characters
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSave}
                      disabled={isLoading}
                      sx={{
                        backgroundColor: "#013366",
                        "&:hover": {
                          backgroundColor: "#012a54",
                        },
                      }}
                    >
                      Save Note
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                {request.note ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f9f9f9",
                      borderRadius: "4px",
                      mb: 1,
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
                        Last updated:{" "}
                        {new Date(request.note_updated_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#606060",
                      fontStyle: "italic",
                      mb: 1,
                    }}
                  >
                    No response added yet
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsEditing(true)}
                  sx={{
                    borderColor: "#255a90",
                    color: "#255a90",
                    "&:hover": {
                      borderColor: "#1e4a75",
                      backgroundColor: "#f1f8fe",
                    },
                  }}
                >
                  {request.note ? "Edit Note" : "Add Note for EAO"}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};
