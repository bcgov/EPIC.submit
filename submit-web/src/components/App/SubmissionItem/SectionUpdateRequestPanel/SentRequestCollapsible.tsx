/**
 * SentRequestCollapsible - Displays a single update request
 * 
 * STAFF VIEW: Shows sent requests with status badges and action buttons
 * - "Requested" badge for OPEN status
 * - "Updated" badge + Accept/Withdraw buttons for PENDING_REVIEW status
 * - Shows EAO staff comment and proponent's response note
 * 
 * PROPONENT VIEW: Shows open requests from EAO
 * - Displays EAO staff comment
 * - Shows proponent's response note (if added)
 * - No action buttons (onAcceptUpdate/onWithdrawUpdate not used)
 */
import React, { useState } from "react";
import { Box, Chip, TextField, Button, Typography } from "@mui/material";
import { SentRequest } from "./types";
import { BCDesignTokens } from "epic.theme";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import ActionSplitButton from "@/components/Shared/ActionSplitButton/ActionSplitButton";
import { UpdateRequestAccordion } from "./UpdateRequestAccordion";
import { useUpdatePackageUpdateRequestNote, useCreatePackageUpdateRequesNote } from "@/hooks/api/usePackages";

interface SentRequestCollapsibleProps {
  request: SentRequest;
  expanded: boolean;
  onToggle: () => void;
  onAcceptUpdate?: (updateRequestId: number) => void; // STAFF ONLY
  onWithdrawUpdate?: (updateRequestId: number) => void; // STAFF ONLY
  onUpdateNote?: (updateRequestId: number, note: string) => void; // PROPONENT: Save note
  isLoading?: boolean; // Loading state for save operation
  packageId: number; // Required for API calls
}

export const SentRequestCollapsible: React.FC<SentRequestCollapsibleProps> = ({
  request,
  expanded,
  onToggle,
  onAcceptUpdate,
  onWithdrawUpdate,
  onUpdateNote,
  isLoading = false,
  packageId,
}) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(request.note || "");
  const maxNoteLength = 500;

  // Hooks for note operations
  const { mutate: createUpdateRequestNote, isPending: isCreatingNote } = 
    useCreatePackageUpdateRequesNote({
      packageId,
    });
  
  const { mutate: updateUpdateRequestNote, isPending: isUpdatingNote } = 
    useUpdatePackageUpdateRequestNote({
      packageId,
    });

  const handleSaveNote = () => {
    const mutationFn = request.note ? updateUpdateRequestNote : createUpdateRequestNote;
    mutationFn({
      updateRequestId: request.updateRequestId,
      packageId,
      data: { note: noteText },
    });
    setIsEditingNote(false);
  };

  const isSavingNote = isCreatingNote || isUpdatingNote;

  const handleEditNote = () => {
    setIsEditingNote(true);
  };
  const handleAcceptUpdate = () => {
    onAcceptUpdate?.(request.updateRequestId);
  };

  const handleWithdrawUpdate = () => {
    onWithdrawUpdate?.(request.updateRequestId);
  };

  const headerRightContent = (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      {/* BOTH: Show "Requested" badge when request is OPEN (awaiting proponent response) */}
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
      {/* STAFF ONLY: Show "Updated" badge and action buttons when proponent has responded */}
      {request.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value && (
        <>
          <Chip
            label="Updated"
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
          <ActionSplitButton
            primaryAction={{
              label: "Accept Update",
              onClick: handleAcceptUpdate,
            }}
            secondaryActions={[
              {
                label: "Withdraw Request",
                onClick: handleWithdrawUpdate,
              },
            ]}
          />
        </>
      )}
    </Box>
  );

  return (
    <UpdateRequestAccordion
      itemTypeName={request.itemTypeName}
      expanded={expanded}
      onToggle={onToggle}
      headerRightContent={headerRightContent}
      reason={request.reason}
      createdBy={request.createdBy}
      createdDate={request.createdDate}
      note={request.note}
      noteUpdatedBy={request.noteUpdatedBy}
      noteUpdatedAt={request.noteUpdatedAt}
      variant="active"
      // PROPONENT: Show edit icon in proponent response when note exists
      showEditIcon={onUpdateNote && !!request.note}
      onEditNote={handleEditNote}
      // PROPONENT: Add note editing UI when onUpdateNote is provided
      noteEditingUI={onUpdateNote && (
        <Box sx={{ mt: 2 }}>
          {!request.note && !isEditingNote && (
            // No note yet: Show Add Note button
            <Button
              variant="outlined"
              onClick={handleEditNote}
              sx={{
                textTransform: "none",
                fontSize: "16px",
                fontFamily: "BCSans, sans-serif",
                lineHeight: "24px",
                height: "40px",
                borderRadius: "4px",
                borderColor: BCDesignTokens.surfaceColorBorderDark,
                color: BCDesignTokens.typographyColorPrimary,
                padding: "7px 16px",
                "&:hover": {
                  borderColor: BCDesignTokens.surfaceColorBorderDark,
                  backgroundColor: "rgba(53, 52, 51, 0.04)",
                },
              }}
            >
              Add Note for EAO
            </Button>
          )}
          {isEditingNote && (
            // Editing mode: Show text area with label and Save button (matches Figma)
            <Box
              sx={{
                backgroundColor: BCDesignTokens.themeGray10,
                p: "12px 12px 12px 15px",
                borderRadius: "4px",
                borderLeft: `3px solid ${BCDesignTokens.themeGold100}`,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Label */}
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "13px",
                    lineHeight: "19.5px",
                    color: BCDesignTokens.typographyColorPrimary,
                    fontFamily: "BCSans, sans-serif",
                  }}
                >
                  Note for the EAO
                </Typography>

                {/* Text Area */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe what you updated and/or add other relevant details."
                  inputProps={{ maxLength: maxNoteLength }}
                  sx={{
                    backgroundColor: "white",
                    marginBottom: 0,
                    "& .MuiOutlinedInput-root": {
                      fontSize: "14px",
                      lineHeight: "21px",
                      fontFamily: "BCSans, sans-serif",
                      padding: "10px 12px",
                      "& fieldset": {
                        borderColor: "#606060",
                      },
                      "&:hover fieldset": {
                        borderColor: "#606060",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#606060",
                        borderWidth: "1px",
                      },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "#9CA3AF",
                      opacity: 1,
                    },
                  }}
                />

                {/* Helper Text */}
                <Typography
                  sx={{
                    fontSize: "13px",
                    lineHeight: "19.5px",
                    marginTop: 1,
                    color: BCDesignTokens.typographyColorPrimary,
                    fontFamily: "BCSans, sans-serif",
                  }}
                >
                  This note will be visible to the EAO after resubmitting your documents
                </Typography>
              </Box>

              {/* Save Button */}
              <Button
                variant="contained"
                onClick={handleSaveNote}
                disabled={isLoading || isSavingNote || noteText.trim().length === 0}
                sx={{
                  textTransform: "none",
                  fontSize: "16px",
                  fontFamily: "BCSans, sans-serif",
                  lineHeight: "24px",
                  height: "40px",
                  width: "108px",
                  borderRadius: "4px",
                  backgroundColor: BCDesignTokens.themeBlue100,
                  color: "white",
                  padding: "8px 16px",
                  "&:hover": {
                    backgroundColor: BCDesignTokens.themeBlue100,
                  },
                  "&:disabled": {
                    backgroundColor: "#cccccc",
                    color: "#666666",
                  },
                }}
              >
                {isLoading ? "Saving..." : "Save Note"}
              </Button>
            </Box>
          )}
        </Box>
      )}
    />
  );
};
