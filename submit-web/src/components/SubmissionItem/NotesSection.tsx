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
import EventNoteIcon from "@mui/icons-material/EventNote";
import Note, { Note as NoteType } from "./Note";
import { When } from "react-if";
import { useEffect, useState } from "react";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateNote } from "@/hooks/api/useSubmissionItemNotes";
import { SubmissionItem } from "@/models/SubmissionItem";
import { LoadingButton } from "@/components/Shared/LoadingButton";

export default function NotesSection() {
  const [addNote, setAddNote] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const { submissionPackageId, submissionId: submissionItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey
  );

  const { notes } = submissionItem;

  useEffect(() => {
    setNoteText("");
  }, [addNote]);

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

  if (!submissionItem) return null;

  const { notes } = submissionItem;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderRadius: "4px",
        border: `1px solid ${BCDesignTokens.themeBlue60}`,
        mb: BCDesignTokens.layoutMarginLarge,
        p: 0,
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
          border: `1px solid ${BCDesignTokens.themeBlue60}`,
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
            width={"90%"}
          >
            <EventNoteIcon
              htmlColor={BCDesignTokens.themeBlue60}
              fontSize={"large"}
              sx={{ mr: 0.5 }}
            />
            <Typography
              variant="h6"
              sx={{
                color: "#38598A",
              }}
            >
              View Notes
            </Typography>
            <When condition={notes && notes.length > 0}>
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
                label={`${notes.length}`}
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
              sx={{ cursor: "pointer" }}
            >
              + Add a Note
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Collapse in={addNote}>
          <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Notes
            </Typography>
            <TextField
              variant="outlined"
              value={noteText}
              multiline
              fullWidth
              minRows={6}
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
              Save Note
            </LoadingButton>
            <Button
              color="secondary"
              onClick={handleCancelNote}
              sx={{ border: "0px" }}
            >
              Cancel
            </Button>
          </Box>
        </Collapse>
        <When condition={notes}>
          {notes.length > 0 ? (
            notes.map((note: NoteType) => <Note key={note.id} note={note} />)
          ) : (
            <Typography variant="body1" sx={{ mb: 1 }}>
              No notes have been added yet.
            </Typography>
          )}
        </When>
      </AccordionDetails>
    </Accordion>
  );
}
