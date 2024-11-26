import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { BCDesignTokens } from "epic.theme";
import EventNoteIcon from "@mui/icons-material/EventNote";
import Note from "./Note";
import { When } from "react-if";
import { useState } from "react";

export default function NotesSection() {
  const mockNotes = [
    {
      id: 1,
      note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit le lobortis eget.",
      created_by: "John Doe",
      date_created: "2021-10-01",
    },
    {
      id: 2,
      note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit le lobortis eget.",
      created_by: "John Doe",
      date_created: "2021-10-01",
    },
    {
      id: 3,
      note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit le lobortis eget.",
      created_by: "John Doe",
      date_created: "2021-10-01",
    },
    {
      id: 4,
      note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit le lobortis eget.",
      created_by: "John Doe",
      date_created: "2021-10-01",
    },
  ];
  const [addNote, setAddNote] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
              justifyContent: "center",
            }}
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
            <KeyboardArrowRightIcon
              fontSize="medium"
              sx={{ ml: 0.5, color: "#38598A", p: 0 }}
            />
          </Box>
          <Box onClick={() => setAddNote(!addNote)}>
            <Typography
              variant="body1"
              color={BCDesignTokens.typographyColorLink}
              sx={{ cursor: "pointer" }}
            >
              + Add Notes
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <When condition={addNote}>
          <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Notes
            </Typography>
            <TextField multiline fullWidth minRows={6} />
            <Button sx={{ mr: BCDesignTokens.layoutMarginSmall }}>
              Save Note
            </Button>
            <Button color="secondary" onClick={() => setAddNote(false)}>
              Cancel
            </Button>
          </Box>
        </When>
        {mockNotes.length > 0 ? (
          mockNotes.map((note) => <Note key={note.id} note={note} />)
        ) : (
          <Typography variant="body1" sx={{ mb: 1 }}>
            No notes have been added yet.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
