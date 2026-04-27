import React, { useState } from "react";
import { Box, Typography, Link } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { BCDesignTokens } from "epic.theme";
import { ProponentRequestAccordion } from "./ProponentRequestAccordion";
import { PreviousRequestAccordion } from "./PreviousRequestAccordion";
import { UpdateRequest } from "@/models/UpdateRequest";

type ProponentUpdateRequestPanelProps = Readonly<{
  openRequests: UpdateRequest[];
  previousRequests: UpdateRequest[];
  onSaveNote: (updateRequestId: number, note: string) => void;
  isLoading?: boolean;
}>;

export const ProponentUpdateRequestPanel: React.FC<
  ProponentUpdateRequestPanelProps
> = ({ openRequests, previousRequests, onSaveNote, isLoading = false }) => {
  const [expandedOpen, setExpandedOpen] = useState<Set<number>>(
    new Set(openRequests.map((r) => r.id))
  );
  const [showPreviousRequests, setShowPreviousRequests] = useState(false);
  const [expandedPrevious, setExpandedPrevious] = useState<Set<number>>(
    new Set()
  );

  const totalCount = openRequests.length;
  const hasAnyRequests = totalCount > 0;

  const panelBorderColor = hasAnyRequests ? "#F8BB47" : "#e0e0e0";
  const panelBackground = hasAnyRequests ? "#FEF8E8" : "#F5F5F5";

  const handleToggleOpen = (updateRequestId: number) => {
    setExpandedOpen((prev) => {
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
            totalCount > 0 ? `1px solid ${panelBorderColor}` : "none",
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
            <Box
              sx={{
                backgroundColor: "#f18a15",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {totalCount}
              </Typography>
            </Box>
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
          {openRequests.map((request) => (
            <ProponentRequestAccordion
              key={request.id}
              request={request}
              expanded={expandedOpen.has(request.id)}
              onToggle={() => handleToggleOpen(request.id)}
              onSaveNote={(note) => onSaveNote(request.id, note)}
              isLoading={isLoading}
            />
          ))}
        </Box>
      )}

      <Box sx={{ pb: 2, px: 2.5, backgroundColor: "white" }}>
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
            {showPreviousRequests
              ? "Hide Previous Requests"
              : "View Previous Requests"}
          </Link>
        </Box>

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
                  <PreviousRequestAccordion
                    key={request.id}
                    request={request}
                    expanded={expandedPrevious.has(request.id)}
                    onToggle={() => handleTogglePrevious(request.id)}
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
