import { Grid } from "@mui/material";
import { TabPanel } from "./TabPanel";
import { useManagementPlanForm } from "./formStore";
import { useEffect } from "react";
import { NewManagementPlanForm } from "./types";

type FormProps = {
  onSubmit: (formData: Partial<NewManagementPlanForm>) => void;
};
export const Form = ({ onSubmit }: FormProps) => {
  const { reset } = useManagementPlanForm();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <Grid container sx={{
      width: "100%"
    }}>
      <Grid
        sx={{
          padding: "24px 0px 12px 0px",
        }}
        container
        size={12}>
        <Grid size={12}>
          <TabPanel onSubmit={onSubmit} />
        </Grid>
      </Grid>
    </Grid>
  );
};
