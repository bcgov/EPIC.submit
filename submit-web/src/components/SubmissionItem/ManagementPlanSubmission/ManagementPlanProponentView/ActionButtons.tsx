import { UnfinishedUploadsCheck } from "@/components/UnfinishedUploadsCheck";
import { Button, Grid } from "@mui/material";

export default function ActionButtons({
  saveAndClose,
  onSubmit,
}: Readonly<{
  saveAndClose: () => void;
  onSubmit: () => void;
}>) {
  return (
    <Grid item xs={12} container spacing={2}>
      <Grid item xs={12} sm="auto">
        <UnfinishedUploadsCheck>
          <Button color="secondary" onClick={saveAndClose}>
            Save & Continue Later
          </Button>
        </UnfinishedUploadsCheck>
      </Grid>
      <Grid item xs={12} sm="auto">
        <UnfinishedUploadsCheck>
          <Button onClick={onSubmit}>Save Completed Form</Button>
        </UnfinishedUploadsCheck>
      </Grid>
    </Grid>
  );
}
