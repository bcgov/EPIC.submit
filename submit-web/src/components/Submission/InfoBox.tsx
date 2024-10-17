import { SubmissionPackage } from "@/models/Package";
import { Grid, Typography } from "@mui/material";
import dayjs from "dayjs";
import { BCDesignTokens } from "epic.theme";

type InfoBoxItemProps = {
  label?: string;
  value?: string;
};
const InfoBoxItem = ({ label, value }: InfoBoxItemProps) => {
  return (
    <Grid container direction="row" spacing={1} alignItems={"flex-start"}>
      <Grid item xs={6}>
        <Typography color={BCDesignTokens.themeGray70}>{label}:</Typography>
      </Grid>
      <Grid item xs="auto">
        <Typography color={"inherit"}>{value}</Typography>
      </Grid>
    </Grid>
  );
};

type InfoBoxProps = {
  submissionPackage: SubmissionPackage;
};
export const InfoBox = ({ submissionPackage }: InfoBoxProps) => {
  return (
    <Grid
      container
      sx={{
        borderRadius: "4px",
        border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
        p: BCDesignTokens.layoutPaddingSmall,
      }}
      rowSpacing={1}
    >
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Condition"} />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Submitted on"}
          value={
            submissionPackage?.submitted_on
              ? dayjs(submissionPackage.submitted_on).format("DD-MMM-YYYY")
              : "--"
          }
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Date Review Completed"} />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Supporting Conditions"} />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Submitted by"}
          value={submissionPackage?.submitted_by}
        />
      </Grid>
    </Grid>
  );
};
