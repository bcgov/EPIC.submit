import { LoadingButton } from "@/components/Shared/LoadingButton";
import { UpdateRequest } from "@/models/UpdateRequest";
import { Box, Button, Collapse, Stack, TextField } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";

type AddRequestNoteSectionProps = Readonly<{
  updateRequest: UpdateRequest;
}>;
export const AddRequestNoteSection = ({
  updateRequest,
}: AddRequestNoteSectionProps) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [note, setNote] = useState("");

  const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNote(event.target.value);
  };
  if (updateRequest.note) {
    return null;
  }

  return (
    <Box mt="1em">
      <Collapse in={isAddingNote}>
        <TextField
          onChange={handleNoteChange}
          value={note}
          variant="outlined"
          multiline
          fullWidth
          minRows={4}
          sx={{
            "& .MuiInputBase-root": {
              borderColor: BCDesignTokens.typographyColorDisabled,
            },
          }}
          helperText="This note will be visible to the EAO after resubmitting your documents"
        />
        <Stack direction="row" spacing={2}>
          <LoadingButton color="primary" variant="contained">
            Save Note
          </LoadingButton>
          <Button
            color="primary"
            variant="text"
            onClick={() => setIsAddingNote(false)}
          >
            Cancel
          </Button>
        </Stack>
      </Collapse>
      <Button
        color="primary"
        variant="outlined"
        onClick={() => setIsAddingNote(true)}
        sx={{ mt: 2 }}
      >
        Add Note
      </Button>
    </Box>
  );
};
