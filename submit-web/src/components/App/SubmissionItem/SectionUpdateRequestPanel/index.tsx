import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PendingRequestCollapsible } from "./PendingRequestCollapsible";
import { SentRequestCollapsible } from "./SentRequestCollapsible";
import { SectionUpdateRequestPanelProps } from "./types";
import { BCDesignTokens } from "epic.theme";

export const SectionUpdateRequestPanel: React.FC<
  SectionUpdateRequestPanelProps
> = ({
  pendingRequests,
  sentRequests,
  onRemoveFlag,
  onSendRequests,
  onUpdateNote,
  isLoading = false,
}) => {
  const [expandedPending, setExpandedPending] = useState<Set<number>>(
    new Set(pendingRequests.map((r) => r.itemTypeId))
  );
  const [expandedSent, setExpandedSent] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExpandedPending(new Set(pendingRequests.map((r) => r.itemTypeId)));
  }, [pendingRequests]);

  const totalCount = pendingRequests.length + sentRequests.length;
  const hasPendingRequests = pendingRequests.length > 0;
  
  const panelBorderColor = hasPendingRequests 
    ? BCDesignTokens.supportBorderColorWarning 
    : "#e0e0e0";
  const panelBackground = hasPendingRequests 
    ? BCDesignTokens.themeGold10 
    : "#fafafa";

  const handleTogglePending = (itemTypeId: number) => {
    setExpandedPending((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemTypeId)) {
        newSet.delete(itemTypeId);
      } else {
        newSet.add(itemTypeId);
      }
      return newSet;
    });
  };

  const handleToggleSent = (updateRequestId: number) => {
    setExpandedSent((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(updateRequestId)) {
        newSet.delete(updateRequestId);
      } else {
        newSet.add(updateRequestId);
      }
      return newSet;
    });
  };

  return (
    <Box
      sx={{
        mt: 3,
        border: `1px solid ${panelBorderColor}`,
        borderRadius: "4px",
        background: panelBackground,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom:
            totalCount > 0
              ? `1px solid ${panelBorderColor}`
              : "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RefreshIcon sx={{ color: BCDesignTokens.themeBlue90 }} />
          <Typography
            variant="h6"
            sx={{
              color: BCDesignTokens.themeBlue90,
              fontWeight: BCDesignTokens.typographyBoldBody,
            }}
          >
            Update Requests
          </Typography>
          {totalCount > 0 && (
            <Typography
              variant="h6"
              sx={{
                color: BCDesignTokens.themeBlue90,
                fontWeight: BCDesignTokens.typographyBoldBody,
              }}
            >
              ({totalCount})
            </Typography>
          )}
        </Box>
      </Box>

      {totalCount === 0 ? (
        <Box
          sx={{
            p: 2.5,
            textAlign: "center",
            borderTop: `1px solid ${panelBorderColor}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#606060",
              fontSize: "14px",
            }}
          >
            No sections have been flagged for update.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          {pendingRequests.map((request) => (
            <PendingRequestCollapsible
              key={request.itemTypeId}
              request={request}
              onRemove={() => onRemoveFlag(request.itemTypeId)}
              onUpdateNote={(note) => onUpdateNote(request.itemTypeId, note)}
              expanded={expandedPending.has(request.itemTypeId)}
              onToggle={() => handleTogglePending(request.itemTypeId)}
            />
          ))}

          {sentRequests.map((request) => (
            <SentRequestCollapsible
              key={request.updateRequestId}
              request={request}
              expanded={expandedSent.has(request.updateRequestId)}
              onToggle={() => handleToggleSent(request.updateRequestId)}
            />
          ))}

          {pendingRequests.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={onSendRequests}
                disabled={isLoading}
                sx={{
                  background: BCDesignTokens.themeBlue90,
                  "&:hover": {
                    background: BCDesignTokens.themeBlue100,
                  },
                }}
              >
                Send Request to Proponent
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
