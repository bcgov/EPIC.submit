import React from "react";
import { Box, Chip, Typography } from "@mui/material";
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
        <Chip
          label="Accepted"
          size="small"
          sx={{
            backgroundColor: BCDesignTokens.supportSurfaceColorSuccess,
            border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
            color: "#2D2D2D",
            fontSize: "12px",
            height: "24px",
            fontWeight: 400,
            borderRadius: "4px",
          }}
        />
      );
    }
    if (isWithdrawn) {
      return (
        <Chip
          label="Withdrawn"
          size="small"
          sx={{
            backgroundColor: BCDesignTokens.supportSurfaceColorDanger,
            border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
            color: "#2D2D2D",
            fontSize: "12px",
            height: "24px",
            fontWeight: 400,
            borderRadius: "2px",
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
