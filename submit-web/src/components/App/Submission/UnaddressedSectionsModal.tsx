import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { UnaddressedSection } from "@/utils/updateRequestHelpers";

type UnaddressedSectionsModalProps = Readonly<{
  open: boolean;
  sections: UnaddressedSection[];
  onConfirm: () => void;
  onCancel: () => void;
}>;

export const UnaddressedSectionsModal: React.FC<
  UnaddressedSectionsModalProps
> = ({ open, sections, onConfirm, onCancel }) => {
  const getMessage = () => {
    if (sections.length === 0) {
      return "";
    }

    if (sections.length === 1) {
      return `We noticed ${sections[0].itemTypeName} hasn't been updated yet. Do you still want to submit your package to the EAO?`;
    }

    const sectionNames = sections.map((s) => s.itemTypeName);
    const lastSection = sectionNames.pop();
    const otherSections = sectionNames.join(", ");

    return `We noticed ${otherSections} and ${lastSection} haven't been updated yet. Do you still want to submit your package to the EAO?`;
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "8px",
          p: 1,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningAmberIcon
            sx={{
              color: "#f18a15",
              fontSize: "32px",
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#2d2d2d",
            }}
          >
            Unaddressed Update Requests
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            fontSize: "16px",
            color: "#2d2d2d",
            lineHeight: 1.6,
            mb: 2,
          }}
        >
          {getMessage()}
        </Typography>

        {sections.length > 0 && (
          <Box
            sx={{
              backgroundColor: "#fef8e8",
              border: "1px solid #f8bb47",
              borderRadius: "4px",
              p: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#2d2d2d",
                mb: 1,
              }}
            >
              Sections without updates:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {sections.map((section) => (
                <Typography
                  component="li"
                  key={section.itemTypeId}
                  sx={{
                    fontSize: "14px",
                    color: "#2d2d2d",
                    mb: 0.5,
                  }}
                >
                  {section.itemTypeName}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            borderColor: "#606060",
            color: "#606060",
            "&:hover": {
              borderColor: "#2d2d2d",
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: "#013366",
            "&:hover": {
              backgroundColor: "#012a54",
            },
          }}
        >
          Submit to EAO
        </Button>
      </DialogActions>
    </Dialog>
  );
};
