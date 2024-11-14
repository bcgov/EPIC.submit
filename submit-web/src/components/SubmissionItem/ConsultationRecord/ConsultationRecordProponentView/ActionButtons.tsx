import { Button, Grid } from "@mui/material";
import React from "react";

export default function ActionButtons({
  saveAndClose,
}: {
  saveAndClose: () => void;
}) {
  return (
    <Grid item xs={12} container spacing={2}>
      <Grid item xs={12} sm="auto">
        <Button color="secondary" onClick={saveAndClose}>
          Save & Continue Later
        </Button>
      </Grid>
      <Grid item xs={12} sm="auto">
        <Button type="submit">Save Completed Form</Button>
      </Grid>
    </Grid>
  );
}
