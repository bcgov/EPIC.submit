/**
 * SectionUpdateRequestPanel - Shared component for displaying update requests
 *
 * USAGE:
 * - STAFF VIEW: Shows pending requests (draft), sent requests (active), and previous requests
 *   - Can create new requests (pendingRequests)
 *   - Can send requests to proponent (onSendRequests)
 *   - Can accept/withdraw sent requests
 *
 * - PROPONENT VIEW: Shows open requests from EAO and previous accepted requests
 *   - pendingRequests should be empty []
 *   - sentRequests contains open requests from EAO
 *   - Can add notes to open requests (onUpdateNote)
 *   - Cannot send requests (onSendRequests is no-op)
 */
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { GIS_ITEM_TYPE_NAME } from "@/utils/constants";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React, { useEffect, useState } from "react";
import { PendingRequestCollapsible } from "./PendingRequestCollapsible";
import { PreviousRequestCollapsible } from "./PreviousRequestCollapsible";
import { SentRequestCollapsible } from "./SentRequestCollapsible";
import { SectionUpdateRequestPanelProps } from "./types";

export const SectionUpdateRequestPanel: React.FC<
  SectionUpdateRequestPanelProps
> = ({
  pendingRequests, // STAFF: Draft requests not yet sent | PROPONENT: Always empty []
  sentRequests, // STAFF: Sent requests awaiting response | PROPONENT: Open requests from EAO
  previousRequests, // BOTH: Accepted/closed requests for reference
  onRemoveFlag, // STAFF: Remove draft request | PROPONENT: No-op
  onSendRequests, // STAFF: Send pending requests | PROPONENT: No-op
  onUpdateNote, // STAFF: Update draft note | PROPONENT: Add response note
  onAcceptUpdate, // STAFF: Accept proponent update | PROPONENT: Not used
  onWithdrawUpdate, // STAFF: Withdraw request | PROPONENT: Not used
  isLoading = false,
  packageId,
}) => {
  const [expandedPending, setExpandedPending] = useState<Set<number>>(
    new Set(pendingRequests.map((r) => r.itemTypeId)),
  );
  const [expandedSent, setExpandedSent] = useState<Set<number>>(new Set());
  const [showPreviousRequests, setShowPreviousRequests] = useState(false);
  const [expandedPrevious, setExpandedPrevious] = useState<Set<number>>(
    new Set(),
  );
  const [validationErrors, setValidationErrors] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    setExpandedPending(new Set(pendingRequests.map((r) => r.itemTypeId)));
  }, [pendingRequests]);

  const totalCount = pendingRequests.length + sentRequests.length;
  const hasAnyRequests = totalCount > 0;

  const panelBorderColor = hasAnyRequests
    ? BCDesignTokens.supportBorderColorWarning
    : BCDesignTokens.surfaceColorBorderDefault;
  const panelBackground = hasAnyRequests
    ? BCDesignTokens.themeGold10
    : BCDesignTokens.themeGray10;

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

  const handleSendRequests = () => {
    // Validate all pending requests have notes
    const invalidRequests = pendingRequests
      .filter((request) => !request.reason || request.reason.trim() === "")
      .map((request) => request.itemTypeId);

    if (invalidRequests.length > 0) {
      setValidationErrors(new Set(invalidRequests));
      // Expand all invalid requests so user can see the errors
      setExpandedPending((prev) => {
        const newSet = new Set(prev);
        invalidRequests.forEach((id) => newSet.add(id));
        return newSet;
      });
      return;
    }

    // Clear any existing errors and proceed
    setValidationErrors(new Set());
    onSendRequests();
  };

  const handleUpdateNote = (itemTypeId: number, note: string) => {
    // Clear validation error when user starts typing
    if (note.trim() !== "") {
      setValidationErrors((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemTypeId);
        return newSet;
      });
    }
    onUpdateNote(itemTypeId, note);
  };

  // Determine if this is proponent view (no action buttons provided)
  const isProponentView = !onAcceptUpdate && !onWithdrawUpdate;

  // Hide panel if there are no active or previous requests
  const hasAnyRequestsAtAll = totalCount > 0 || previousRequests.length > 0;
  if (!hasAnyRequestsAtAll) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 3,
        width: "100%",
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
          backgroundColor: hasAnyRequests ? "#fcf8e3" : panelBackground,
          px: "20px",
          py: 1,
          borderBottom:
            totalCount > 0
              ? `1px solid ${hasAnyRequests ? "#f5a623" : panelBorderColor}`
              : "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RefreshIcon
            sx={{
              color: hasAnyRequests
                ? BCDesignTokens.themeGold100
                : BCDesignTokens.themeGray70,
              fontSize: "16px",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: "#2d2d2d",
              fontWeight: 700,
              fontSize: "18px",
              lineHeight: "30.6px",
            }}
          >
            Update Requests
          </Typography>
          {totalCount > 0 && (
            <Box
              sx={{
                backgroundColor: "#f5a623",
                color: "white",
                borderRadius: "11px",
                width: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                lineHeight: "18px",
              }}
            >
              {totalCount}
            </Box>
          )}
        </Box>
        {sentRequests.length > 0 && (
          <Typography
            sx={{
              color: "#606060",
              fontSize: "12px",
              fontStyle: "italic",
              lineHeight: "18px",
            }}
          >
            Awaiting entity response
          </Typography>
        )}
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
              color: BCDesignTokens.themeGray80,
              fontSize: "14px",
            }}
          >
            No sections have been flagged for update.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ pt: 2, pl: 2, pr: 2, backgroundColor: "white" }}>
          {/* STAFF ONLY: Draft requests not yet sent to proponent */}
          {pendingRequests.map((request) => (
            <PendingRequestCollapsible
              key={request.itemTypeId}
              request={request}
              onRemove={() => onRemoveFlag(request.itemTypeId)}
              onUpdateNote={(note) =>
                handleUpdateNote(request.itemTypeId, note)
              }
              expanded={expandedPending.has(request.itemTypeId)}
              onToggle={() => handleTogglePending(request.itemTypeId)}
              hasError={validationErrors.has(request.itemTypeId)}
            />
          ))}
          {/* STAFF ONLY: Button to send pending requests to proponent */}
          {pendingRequests.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <LoadingButton
                variant="contained"
                onClick={handleSendRequests}
                disabled={isLoading}
                sx={{
                  background: BCDesignTokens.themeBlue90,
                  "&:hover": {
                    background: BCDesignTokens.themeBlue100,
                  },
                }}
              >
                Send Request to Proponent
              </LoadingButton>
            </Box>
          )}

          {/* STAFF: Sent requests | PROPONENT: Open requests from EAO */}
          {sentRequests.map((request) => (
            <SentRequestCollapsible
              key={request.updateRequestId}
              request={request}
              expanded={expandedSent.has(request.updateRequestId)}
              onToggle={() => handleToggleSent(request.updateRequestId)}
              onAcceptUpdate={onAcceptUpdate}
              onWithdrawUpdate={onWithdrawUpdate}
              onUpdateNote={isProponentView ? onUpdateNote : undefined}
              isLoading={isLoading}
              packageId={packageId}
              isProponentView={isProponentView}
              isGISRequest={request.itemTypeName === GIS_ITEM_TYPE_NAME}
            />
          ))}
        </Box>
      )}
      <Box sx={{ pb: 2, px: 2.5, backgroundColor: "white" }}>
        {/* BOTH: View Previous Requests Link - Always visible */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Link
            component="button"
            onClick={() => setShowPreviousRequests(!showPreviousRequests)}
            sx={{
              color: BCDesignTokens.typographyColorLink,
              fontSize: "13px",
              fontWeight: 400,
              textDecoration: "none",
              cursor: "pointer",
              p: 0.75,
            }}
          >
            {showPreviousRequests
              ? "Hide Previous Requests"
              : "View Previous Requests"}
          </Link>
        </Box>

        {/* BOTH: Previous Requests Section - Shows accepted/closed requests */}
        {showPreviousRequests && (
          <>
            <Box
              sx={{
                borderTop: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                pt: 2.125,
                mb: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: "18px",
                  fontWeight: 400,
                  color: BCDesignTokens.typographyColorPrimary,
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
                    color: BCDesignTokens.themeGray80,
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
                    onToggle={() =>
                      handleTogglePrevious(request.updateRequestId)
                    }
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
