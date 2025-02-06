import { LoadingButton } from "@/components/Shared/LoadingButton";
import { useCreatePackageUpdateRequesNote } from "@/hooks/api/usePackages";
import { UpdateRequest } from "@/models/UpdateRequest";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import {
  Box,
  Button,
  Collapse,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";
import { When } from "react-if";

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

  const { mutate: createUpdateRequestNote, isPending: isCreatingNote } =
    useCreatePackageUpdateRequesNote({
      packageId: updateRequest.submission_package_id,
    });

  const { userType } = useAccount();
  const isProponent = userType === USER_TYPE.PROPONENT;

  return (
    <Box mt="1em">
      <Collapse in={isAddingNote && !updateRequest.note}>
        <Typography
          variant="body1"
          sx={{ mb: 1, fontWeight: BCDesignTokens.typographyFontWeightsBold }}
        >
          Note for the EAO
        </Typography>
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
          <LoadingButton
            color="primary"
            variant="contained"
            onClick={() =>
              createUpdateRequestNote({
                updateRequestId: updateRequest.id,
                packageId: updateRequest.submission_package_id,
                data: { note },
              })
            }
            loading={isCreatingNote}
          >
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
      <When condition={isProponent && !updateRequest.note && !isAddingNote}>
        <Button
          color="primary"
          variant="outlined"
          onClick={() => setIsAddingNote(true)}
          sx={{ mt: 2 }}
        >
          Add Note
        </Button>
      </When>
    </Box>
  );
};
