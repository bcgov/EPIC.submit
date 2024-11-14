import { Button, Grid } from "@mui/material";

export default function ActionButtons({
  saveAndClose,
}: {
  saveAndClose: () => void;
}) {
  return (
    <Grid item xs={12} container spacing={2}>
      <Grid item xs={12} sm="auto">
        <Button color="secondary" onClick={saveAndClose}>
          Save & Exit
        </Button>
      </Grid>
      <Grid item xs={12} sm="auto">
        <Button type="submit">Send Recommendations to Manager</Button>
      </Grid>
    </Grid>
  );
}
