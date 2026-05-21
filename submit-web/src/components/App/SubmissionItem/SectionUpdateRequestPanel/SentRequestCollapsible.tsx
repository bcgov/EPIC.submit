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
import { Box, TextField, Button, Typography, Chip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
  isProponentView?: boolean; // PROPONENT: Show notes even when status is OPEN
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
  isProponentView = false,
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
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "25%", justifyContent: "space-between" }}>
      {/* STAFF: Show "Requested" badge and Withdraw Update button when request is OPEN */}
      {request.status === UPDATE_REQUEST_STATUS.OPEN.value && (
        <>
          <Chip
            label="Requested"
            size="small"
            sx={{
              backgroundColor: "#fcf8e3",
              border: "1px solid #f5a623",
              color: "#2d2d2d",
              fontSize: "12px",
              height: "24px",
              fontWeight: 400,
              fontFamily: "BCSans, sans-serif",
            }}
          />
          {onWithdrawUpdate && (
            <ActionSplitButton
              primaryAction={{
                label: "Withdraw Update",
                onClick: handleWithdrawUpdate,
                icon: <CloseIcon sx={{ fontSize: 13 }} />,
              }}
              secondaryActions={[]}
            />
          )}
        </>
      )}
      {/* STAFF: Show "Updated" badge and Accept Update button when proponent has responded */}
      {request.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value && (
        <>
          <Chip
            label="Updated"
            size="small"
            sx={{
              backgroundColor: "#f6e4ff",
              border: "1px solid #9b6bda",
              borderRadius: "2px",
              color: "#2d2d2d",
              fontSize: "12px",
              height: "24px",
              fontWeight: 400,
              fontFamily: "BCSans, sans-serif",
            }}
          />
          {onAcceptUpdate && (
            <ActionSplitButton
              primaryAction={{
                label: "Accept Update",
                onClick: handleAcceptUpdate,
              }}
              secondaryActions={[]}
            />
          )}
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
      status={request.status}
      isProponentView={isProponentView}
      // PROPONENT: Show edit icon in proponent response when note exists and status is OPEN
      showEditIcon={onUpdateNote && !!request.note && request.status === UPDATE_REQUEST_STATUS.OPEN.value}
      onEditNote={handleEditNote}
      // PROPONENT: Add note editing UI when onUpdateNote is provided and status is OPEN
      noteEditingUI={onUpdateNote && request.status === UPDATE_REQUEST_STATUS.OPEN.value && (
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
                    fontSize: "14px",
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
