import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useMemo, useState } from "react";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { SubmissionPackage } from "@/models/Package";
import { CheckboxGroup } from "@/components/Shared/CheckboxGroup";
import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";

type AddRequestSectionProps = {
  submissionPackage: SubmissionPackage;
  isCreatingUpdateRequest: boolean;
  handleCreateUpdateRequest: ({
    note,
    submissionItems,
  }: {
    note: string;
    submissionItems: unknown[];
  }) => void;
  handleCancelNote: () => void;
};
export default function AddRequestSection({
  submissionPackage,
  handleCreateUpdateRequest,
  isCreatingUpdateRequest,
  handleCancelNote,
}: AddRequestSectionProps) {
  const [noteText, setNoteText] = useState("");

  const [selectedSubmissionItems, setSelectedSubmissionItems] = useState<
    unknown[]
  >([]);

  const onCreateUpdateRequest = () => {
    handleCreateUpdateRequest({
      note: noteText,
      submissionItems: selectedSubmissionItems,
    });
  };

  const filteredItems = useMemo(() => {
    return submissionPackage.items.filter(
      (item) =>
        item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD,
    );
  }, [submissionPackage.items]);

  return (
    <Box>
      <Typography variant="body1">Update requested for</Typography>
      <CheckboxGroup onChange={(values) => setSelectedSubmissionItems(values)}>
        {filteredItems.map((item) => (
          <FormControlLabel
            key={item.id}
            control={<Checkbox value={item.id} />}
            label={item.type.name}
          />
        ))}
      </CheckboxGroup>
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
          onClick={onCreateUpdateRequest}
          sx={{ mr: BCDesignTokens.layoutMarginSmall }}
          loading={isCreatingUpdateRequest}
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
    </Box>
  );
}
