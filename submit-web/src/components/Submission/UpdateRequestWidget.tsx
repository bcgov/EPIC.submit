import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Collapse,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useCreateNote } from "@/hooks/api/useSubmissionItemNotes";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { RadioOptions } from "./constants";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { updateRequestedSchema } from "./constants";
import RequestNote from "./RequestNote";

type UpdateRequestedForm = yup.InferType<typeof updateRequestedSchema>;

export default function UpdateRequestWidget() {
  const [addNote, setAddNote] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const { submissionPackageId, submissionId: submissionItemId } = useParams({
    strict: false,
  });

  const mockRequestNotes = [
    {
      id: "1",
      note: "This is the first request note.",
      created_by: "UserA",
      created_date: "2024-12-15T10:30:00Z",
      updated: false,
    },
    {
      id: "2",
      note: "Follow-up needed for the initial request.",
      created_by: "UserB",
      created_date: "2024-12-14T14:45:00Z",
      updated: true,
    },
    {
      id: "3",
      note: "Reviewed the request and everything looks good.",
      created_by: "UserC",
      created_date: "2024-12-13T08:20:00Z",
      updated: false,
    },
    {
      id: "4",
      note: "Awaiting additional information from the client.",
      created_by: "UserA",
      created_date: "2024-12-12T16:00:00Z",
      updated: true,
    },
    {
      id: "5",
      note: "Client has provided the missing documents.",
      created_by: "UserD",
      created_date: "2024-12-11T09:15:00Z",
      updated: true,
    },
  ];

  useEffect(() => {
    setNoteText("");
  }, [addNote]);

  const methods = useForm<UpdateRequestedForm>({
    resolver: yupResolver(updateRequestedSchema),
    mode: "onChange",
  });

  const { mutateAsync: createNote, isPending: createNoteLoading } =
    useCreateNote({
      itemId: Number(submissionItemId),
      packageId: Number(submissionPackageId),
    });

  const handleAddNote = () => {
    setExpanded(true);
    setAddNote(!addNote);
  };

  const handleSaveNote = async () => {
    createNote({
      submission_item_id: Number(submissionItemId),
      note: {
        note: noteText,
      },
    });
    setAddNote(false);
  };

  const handleCancelNote = () => {
    setAddNote(false);
    setExpanded(false);
  };

  if (!mockRequestNotes) return null;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderRadius: "4px",
        border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
        mb: BCDesignTokens.layoutMarginLarge,
        p: 0,
        width: "100%",
      }}
      expanded={expanded}
    >
      <AccordionSummary
        expandIcon={null}
        aria-controls="panel1-content"
        id="panel1-header"
        sx={{
          py: 0,
          borderRadius: "4px",
          border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "space-between",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Box
            onClick={() => setExpanded(!expanded)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
            width={"80%"}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#38598A",
              }}
            >
              Submission/Update Request
            </Typography>
            <When condition={mockRequestNotes && mockRequestNotes.length > 0}>
              <Chip
                sx={{
                  backgroundColor: "#F18A15",
                  borderRadius: "100%",
                  ml: BCDesignTokens.layoutMarginXsmall,
                  width: "20px",
                  height: "20px",
                  "& .MuiChip-label": {
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                }}
                label={`${mockRequestNotes.length}`}
              />
            </When>
            <KeyboardArrowRightIcon
              fontSize="medium"
              sx={{ color: "#38598A", p: 0 }}
            />
          </Box>
          <Box onClick={handleAddNote}>
            <Typography
              variant="body1"
              color={BCDesignTokens.typographyColorLink}
              sx={{ cursor: "pointer", width: "100%" }}
            >
              + Request an Update
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pb: 0 }}>
        <Collapse in={addNote}>
          <FormProvider {...methods}>
            <form>
              <Typography variant="body1">Update requested for</Typography>
              <ControlledRadioGroup name="updateRequested">
                <SubmitRadio
                  label={RadioOptions.CR.label}
                  value={RadioOptions.CR.value}
                />
                <SubmitRadio
                  label={RadioOptions.MP.label}
                  value={RadioOptions.MP.value}
                />
              </ControlledRadioGroup>
              <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
                <Typography variant="body1">Request Note</Typography>
                <TextField
                  variant="outlined"
                  value={noteText}
                  multiline
                  fullWidth
                  minRows={4}
                  onChange={(e) => setNoteText(e.target.value)}
                  sx={{
                    "& .MuiInputBase-root": {
                      borderColor: BCDesignTokens.typographyColorDisabled,
                    },
                  }}
                />
                <LoadingButton
                  onClick={handleSaveNote}
                  sx={{ mr: BCDesignTokens.layoutMarginSmall }}
                  loading={createNoteLoading}
                >
                  Send Request to Holder
                </LoadingButton>
                <Button
                  color="secondary"
                  onClick={handleCancelNote}
                  sx={{ border: "0px" }}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </FormProvider>
        </Collapse>
        <When condition={mockRequestNotes}>
          {mockRequestNotes.length > 0 ? (
            mockRequestNotes.map((requestNote) => (
              <RequestNote key={requestNote.id} note={requestNote} />
            ))
          ) : (
            <Typography variant="body1" sx={{ mb: 1 }}>
              No mockRequestNotes have been made yet.
            </Typography>
          )}
        </When>
      </AccordionDetails>
    </Accordion>
  );
}
