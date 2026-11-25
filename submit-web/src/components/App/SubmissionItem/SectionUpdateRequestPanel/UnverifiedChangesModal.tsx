import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { Submission } from "@/models/Submission";
import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import { LoadingButton } from "@/components/Shared/LoadingButton";

type Props = {
  open: boolean;
  documents: { section: string; submission: Submission; status: string }[];
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
};

export function UnverifiedChangesModal({
  open,
  documents,
  onCancel,
  onConfirm,
  isLoading,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="unverified-changes-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="unverified-changes-title">
        Unverified Changes
      </DialogTitle>
      <DialogContent>
        <Typography>
          The proponent has submitted {documents.length} new or replaced
          documents that have not been verified yet. They may already include
          the changes you are requesting.
        </Typography>
        <List>
          {documents.map(({ section, submission, status }) => (
            <ListItem
              key={submission.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.5,
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>{section}</Typography>
              <Typography sx={{ overflowWrap: "anywhere" }}>
                {submission.submitted_document?.name}
              </Typography>
              <SubmissionStatusChip status={status} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          disabled={isLoading}
          onClick={onConfirm}
        >
          Send Request
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
