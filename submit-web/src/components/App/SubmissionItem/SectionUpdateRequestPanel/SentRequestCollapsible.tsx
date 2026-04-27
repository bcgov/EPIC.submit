import React from "react";
import { Box, Chip } from "@mui/material";
import { SentRequest } from "./types";
import { BCDesignTokens } from "epic.theme";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import ActionSplitButton from "@/components/Shared/ActionSplitButton/ActionSplitButton";
import { UpdateRequestAccordion } from "./UpdateRequestAccordion";

interface SentRequestCollapsibleProps {
  request: SentRequest;
  expanded: boolean;
  onToggle: () => void;
  onAcceptUpdate?: (updateRequestId: number) => void;
  onWithdrawUpdate?: (updateRequestId: number) => void;
}

export const SentRequestCollapsible: React.FC<SentRequestCollapsibleProps> = ({
  request,
  expanded,
  onToggle,
  onAcceptUpdate,
  onWithdrawUpdate,
}) => {
  const handleAcceptUpdate = () => {
    onAcceptUpdate?.(request.updateRequestId);
  };

  const handleWithdrawUpdate = () => {
    onWithdrawUpdate?.(request.updateRequestId);
  };

  const headerRightContent = (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
    />
  );
};
