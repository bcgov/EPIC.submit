import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Link } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PendingRequestCollapsible } from "./PendingRequestCollapsible";
import { SentRequestCollapsible } from "./SentRequestCollapsible";
import { PreviousRequestCollapsible } from "./PreviousRequestCollapsible";
import { SectionUpdateRequestPanelProps } from "./types";
import { BCDesignTokens } from "epic.theme";

export const SectionUpdateRequestPanel: React.FC<
  SectionUpdateRequestPanelProps
> = ({
  pendingRequests,
  sentRequests,
  previousRequests,
  onRemoveFlag,
  onSendRequests,
  onUpdateNote,
  onAcceptUpdate,
  onWithdrawUpdate,
  isLoading = false,
}) => {
  const [expandedPending, setExpandedPending] = useState<Set<number>>(
    new Set(pendingRequests.map((r) => r.itemTypeId))
  );
  const [expandedSent, setExpandedSent] = useState<Set<number>>(new Set());
  const [showPreviousRequests, setShowPreviousRequests] = useState(false);
  const [expandedPrevious, setExpandedPrevious] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExpandedPending(new Set(pendingRequests.map((r) => r.itemTypeId)));
  }, [pendingRequests]);

  const totalCount = pendingRequests.length + sentRequests.length;
  const hasAnyRequests = totalCount > 0;
  
  const panelBorderColor = hasAnyRequests 
    ? "#F5A623" 
    : "#e0e0e0";
  const panelBackground = hasAnyRequests 
    ? "#FCF8E3" 
    : "#F5F5F5";

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

  const handleTogglePrevious = (updateRequestId: number) => {
    setExpandedPrevious((prev) => {
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
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "4px",
          backgroundColor: panelBackground,
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
            backgroundColor: "white",
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
        <Box sx={{ pt: 2, pl: 2, pr: 2, backgroundColor: "white" }}>
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
              onAcceptUpdate={onAcceptUpdate}
              onWithdrawUpdate={onWithdrawUpdate}
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
<Box sx={{ pb: 2, px: 2.5 }}>
      {/* View Previous Requests Link - Always visible */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Link
              component="button"
              onClick={() => setShowPreviousRequests(!showPreviousRequests)}
              sx={{
                color: "#255A90",
                fontSize: "13px",
                fontWeight: 400,
                textDecoration: "none",
                cursor: "pointer",
                p: 0.75,
              }}
            >
              {showPreviousRequests ? "Hide Previous Requests" : "View Previous Requests"}
            </Link>
          </Box>

      {/* Previous Requests Section - Only show when expanded */}
      {showPreviousRequests && (
        <>
          <Box sx={{ borderTop: `1px solid #D8D8D8`, pt: 2.125, mb: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: "18px",
                fontWeight: 400,
                color: "#2D2D2D",
              }}
            >
              Previous Requests
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {previousRequests.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  fontSize: "14px",
                  color: "#606060",
                  py: 2,
                  textAlign: "center",
                }}
              >
                No previous update requests
              </Typography>
            ) : (
              previousRequests.map((request) => (
                <PreviousRequestCollapsible
                  key={request.updateRequestId}
                  request={request}
                  expanded={expandedPrevious.has(request.updateRequestId)}
                  onToggle={() => handleTogglePrevious(request.updateRequestId)}
                />
              ))
            )}
          </Box>
        </>
      )}
        </Box>
    </Box>
  );
};
