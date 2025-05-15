import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { Button, Grid } from "@mui/material";

export default function ActionButtons({
  saveAndClose,
}: Readonly<{
  saveAndClose: () => void;
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
          <Button type="submit">Save Completed Form</Button>
        </UnfinishedUploadsCheck>
      </Grid>
    </Grid>
  );
}
