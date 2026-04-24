import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SentRequest } from "./types";
import { BCDesignTokens } from "epic.theme";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import ActionSplitButton from "@/components/Shared/ActionSplitButton/ActionSplitButton";

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

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      sx={{
        border: "1px solid #e0e0e0",
        background: "#fafafa",
        borderRadius: "4px",
        mb: 2,
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          "& .MuiAccordionSummary-content": {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {request.itemTypeName}
        </Typography>
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
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              backgroundColor: "#F5F5F5",
              p: 2,
              borderRadius: "4px",
              borderLeft: "4px solid #036",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: "14px",
                  fontFamily: "BCSans, sans-serif",
                  color: "#003366",
                }}
              >
                EAO Staff — {request.accountAdministrator || request.createdBy}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "12px",
                  color: BCDesignTokens.typographyColorSecondary,
                }}
              >
                {new Date(request.createdDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {request.reason || "No reason provided"}
            </Typography>
          </Box>
          {request.note && (
            <Box
              sx={{
                backgroundColor: "#F5F5F5",
                p: 2,
                borderRadius: "4px",
                borderLeft: "4px solid #FCBA19",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "14px",
                    fontFamily: "BCSans, sans-serif",
                  }}
                >
                  Proponent — {request.proponentName || request.accountAdministrator || "Unknown"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "12px",
                    color: BCDesignTokens.typographyColorSecondary,
                  }}
                >
                  {request.noteDate ? new Date(request.noteDate).toLocaleDateString() : new Date(request.createdDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {request.note}
              </Typography>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
