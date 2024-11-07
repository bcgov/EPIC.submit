import { SubmissionPackage } from "@/models/Package";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Grid, Typography } from "@mui/material";
import dayjs from "dayjs";
import { BCDesignTokens } from "epic.theme";
import { Case, Switch } from "react-if";

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
  const { userType } = useAccount();

  return (
    <Switch>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffInfoBox submissionPackage={submissionPackage} />
      </Case>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentInfoBox submissionPackage={submissionPackage} />
      </Case>
    </Switch>
  );
};

const ProponentInfoBox = ({ submissionPackage }: InfoBoxProps) => {
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
        <InfoBoxItem
          label={"Condition"}
          value={submissionPackage.meta?.condition}
        />
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
        <InfoBoxItem
          label={"Date Review Completed"}
          value={submissionPackage.meta?.date_review_completed}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Supporting Conditions"}
          value={submissionPackage.meta?.supporting_condition}
        />
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

const StaffInfoBox = ({ submissionPackage }: InfoBoxProps) => {
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
        <InfoBoxItem
          label={"Condition"}
          value={submissionPackage.meta?.conditions.value[0]}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"CC Start Date"}
          value={submissionPackage.meta?.cc_start_date}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Submitted by"}
          value={submissionPackage?.submitted_by}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Supporting Conditions"}
          value={submissionPackage.meta?.cc_completed_on}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"CC Completed"}
          value={submissionPackage.meta?.cc_completed_on}
        />
      </Grid>
      <Grid item xs={12} lg={4} container></Grid>
      <Grid item xs={12} lg={4} container></Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Review Start Date"}
          value={submissionPackage.meta?.review_start_date}
        />
      </Grid>
      <Grid item xs={12} lg={4} container></Grid>
      <Grid item xs={12} lg={4} container></Grid>
      <Grid
        item
        xs={12}
        lg={4}
        container
        sx={{ mb: BCDesignTokens.layoutMarginXsmall }}
      >
        <InfoBoxItem
          label={"Review Completed"}
          value={submissionPackage.meta?.review_completed_on}
        />
      </Grid>
    </Grid>
  );
};
