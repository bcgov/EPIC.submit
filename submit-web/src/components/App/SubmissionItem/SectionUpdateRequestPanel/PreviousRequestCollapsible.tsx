import React from "react";
import { Box, Typography } from "@mui/material";
import { StatusChip } from "@/components/Shared/StatusChip";
import { PreviousRequest } from "./types";
import { BCDesignTokens } from "epic.theme";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import { UpdateRequestAccordion } from "./UpdateRequestAccordion";

interface PreviousRequestCollapsibleProps {
  request: PreviousRequest;
  expanded: boolean;
  onToggle: () => void;
}

export const PreviousRequestCollapsible: React.FC<PreviousRequestCollapsibleProps> = ({
  request,
  expanded,
  onToggle,
}) => {
  const isAccepted = request.status === UPDATE_REQUEST_STATUS.ACCEPTED.value;
  const isWithdrawn = request.status === UPDATE_REQUEST_STATUS.CLOSED.value;

  const getStatusBadge = () => {
    if (isAccepted) {
      return (
        <StatusChip
          label="Accepted"
          theme="success"
          sx={{
            fontSize: "12px",
            fontWeight: 400,
          }}
        />
      );
    }
    if (isWithdrawn) {
      return (
        <StatusChip
          label="Withdrawn"
          theme="danger"
          sx={{
            fontSize: "12px",
            fontWeight: 400,
          }}
        />
      );
    }
    return null;
  };

  const headerRightContent = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "25%", justifyContent: "space-between" }}>
      {getStatusBadge()}
      <Typography
        variant="body2"
        sx={{
          fontSize: "12px",
          color: BCDesignTokens.themeGray80,
          lineHeight: "18px",
        }}
      >
        Sent {new Date(request.createdDate).toISOString().split('T')[0]}
      </Typography>
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
      variant="previous"
      status={request.status}
    />
  );
};
