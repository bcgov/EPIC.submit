/**
 * ProponentUpdateRequestPanel - Wrapper component for proponent view of update requests
 * 
 * This component provides the outer container styling and collapse/expand behavior
 * for the proponent view, matching the Figma design specifications.
 * 
 * Design specs:
 * - Grey panel when no active requests (collapsed by default)
 * - Yellow panel with orange badge when there are active requests
 * - Collapsible/expandable with chevron control
 * - "View Previous Requests" link always visible at bottom-right
 */
import React, { useState } from "react";
import { Box, Typography, Link, Chip, Collapse, IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { BCDesignTokens } from "epic.theme";
import { SentRequestCollapsible } from "../SectionUpdateRequestPanel/SentRequestCollapsible";
import { PreviousRequestCollapsible } from "../SectionUpdateRequestPanel/PreviousRequestCollapsible";
import { ProponentUpdateRequestPanelProps } from "./types";

export const ProponentUpdateRequestPanel: React.FC<ProponentUpdateRequestPanelProps> = ({
  sentRequests,
  previousRequests,
  onUpdateNote,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(sentRequests.length > 0);
  const [showPreviousRequests, setShowPreviousRequests] = useState(false);
  const [expandedSent, setExpandedSent] = useState<Set<number>>(new Set());
  const [expandedPrevious, setExpandedPrevious] = useState<Set<number>>(new Set());

  const hasActiveRequests = sentRequests.length > 0;

  // Styling based on Figma designs
  const panelBorderColor = hasActiveRequests ? "#f8bb47" : "#d8d8d8";
  const panelBackground = hasActiveRequests ? "#fef8e8" : "#faf9f8";

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
        width: "100%",
        border: `1px solid ${panelBorderColor}`,
        borderRadius: "4px",
      }}
    >
      {/* Panel Header - Always visible */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "4px",
          backgroundColor: panelBackground,
          p: 2,
          cursor: "pointer",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: BCDesignTokens.themeBlue90,
              fontWeight: BCDesignTokens.typographyBoldBody,
            }}
          >
            Update Requests
          </Typography>
          {hasActiveRequests && (
            <Chip
              label={sentRequests.length}
              size="small"
              sx={{
                backgroundColor: "#f18a15",
                color: "white",
                fontSize: "12.8px",
                height: "20px",
                minWidth: "20px",
                width: "20px",
                borderRadius: "50%",
                fontWeight: BCDesignTokens.typographyBoldBody,
                "& .MuiChip-label": {
                  px: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
              }}
            />
          )}
        </Box>
        <IconButton
          sx={{
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
            p: 0.5,
          }}
        >
          <ChevronRightIcon sx={{ color: BCDesignTokens.themeBlue90 }} />
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isExpanded}>
        {!hasActiveRequests ? (
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
          <Box sx={{ pt: 2, pl: 2, pr: 2}}>
            {/* Open requests from EAO */}
            {sentRequests.map((request) => (
              <SentRequestCollapsible
                key={request.updateRequestId}
                request={request}
                expanded={expandedSent.has(request.updateRequestId)}
                onToggle={() => handleToggleSent(request.updateRequestId)}
                onUpdateNote={onUpdateNote}
                isLoading={isLoading}
              />
            ))}
          </Box>
        )}

        {/* View Previous Requests Link - Always visible */}
        <Box sx={{ pb: 2, px: 2.5}}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Link
              component="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreviousRequests(!showPreviousRequests);
              }}
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

          {/* Previous Requests Section */}
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
      </Collapse>
    </Box>
  );
};
