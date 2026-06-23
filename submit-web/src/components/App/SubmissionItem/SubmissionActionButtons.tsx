import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { Button, Grid } from "@mui/material";

export default function SubmissionActionButtons({
  saveAndClose,
  onSubmit,
  submitButtonText = "Save Completed Form",
  submitCondition,
}: Readonly<{
  saveAndClose?: () => void;
  onSubmit?: () => void;
  submitButtonText?: string;
  submitCondition?: boolean;
}>) {
  return (
    <Grid item xs={12} container spacing={2}>
      {saveAndClose && (
        <Grid item xs={12} sm="auto">
          <UnfinishedUploadsCheck>
            <Button color="secondary" onClick={saveAndClose}>
              Save & Continue Later
            </Button>
          </UnfinishedUploadsCheck>
        </Grid>
      )}
      {onSubmit && (
        <Grid item xs={12} sm="auto">
          <UnfinishedUploadsCheck customCondition={submitCondition}>
            <Button onClick={onSubmit}>{submitButtonText}</Button>
          </UnfinishedUploadsCheck>
        </Grid>
      )}
    </Grid>
  );
}
