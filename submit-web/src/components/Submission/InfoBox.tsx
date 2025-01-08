import { SubmissionPackage } from "@/models/Package";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Grid, Stack, Typography } from "@mui/material";
import { ReactNode } from "@tanstack/react-router";
import dayjs from "dayjs";
import { BCDesignTokens } from "epic.theme";
import { Case, Switch } from "react-if";
import VersionGroup from "./VersionGroup";

type InfoBoxItemProps = {
  label?: string;
  value?: ReactNode;
};
const InfoBoxItem = ({ label = "", value = "" }: InfoBoxItemProps) => {
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
  isPackageUpdating: boolean;
  setPackageId: (newPackageId: number) => void;
};
export const InfoBox = ({
  submissionPackage,
  isPackageUpdating,
  setPackageId,
}: InfoBoxProps) => {
  const { userType } = useAccount();

  return (
    <Switch>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffInfoBox
          setPackageId={setPackageId}
          isPackageUpdating={isPackageUpdating}
          submissionPackage={submissionPackage}
        />
      </Case>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentInfoBox
          setPackageId={setPackageId}
          isPackageUpdating={isPackageUpdating}
          submissionPackage={submissionPackage}
        />
      </Case>
    </Switch>
  );
};

const ProponentInfoBox = ({
  submissionPackage,
  isPackageUpdating,
  setPackageId,
}: InfoBoxProps) => {
  const {
    submitted_on,
    date_review_completed,
    supporting_condition,
    submitted_by,
    condition,
  } = submissionPackage.meta || {};
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
      <Stack direction={"row"} spacing={1}>
        <Typography color={BCDesignTokens.themeGray70}>Version: </Typography>
        <VersionGroup
          packageId={submissionPackage.id}
          isPackageUpdating={isPackageUpdating}
          updatePackageId={setPackageId}
        />
      </Stack>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Condition"} value={condition} />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Submitted on"}
          value={submitted_on ? dayjs(submitted_on).format("DD-MMM-YYYY") : ""}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Date Review Completed"}
          value={date_review_completed}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Supporting Conditions"}
          value={supporting_condition}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Submitted by"} value={submitted_by} />
      </Grid>
    </Grid>
  );
};

const StaffInfoBox = ({
  submissionPackage,
  isPackageUpdating,
  setPackageId,
}: InfoBoxProps) => {
  const {
    review_start_date,
    supporting_condition,
    review_completed_on,
    cc_start_date,
    cc_completed_on,
  } = submissionPackage.meta || {};
  const { submitted_on, submitted_by } = submissionPackage;

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
      <Grid
        item
        xs={12}
        lg={12}
        container
        alignContent={"flex-end"}
        justifyContent={"flex-end"}
      >
        <Stack
          direction={"row"}
          spacing={1}
          pr={BCDesignTokens.layoutPaddingMedium}
        >
          <Typography color={BCDesignTokens.themeGray70}>Version: </Typography>
          <VersionGroup
            packageId={submissionPackage.id}
            isPackageUpdating={isPackageUpdating}
            updatePackageId={setPackageId}
          />
        </Stack>
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Submitted on"}
          value={submitted_on ? dayjs(submitted_on).format("DD-MMM-YYYY") : ""}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Condition"} />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"CC Start Date"}
          value={
            cc_start_date ? dayjs(cc_start_date).format("DD-MMM-YYYY") : ""
          }
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Submitted by"} value={submitted_by} />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Supporting Conditions"}
          value={supporting_condition}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"CC Completed"}
          value={
            cc_completed_on ? dayjs(cc_completed_on).format("DD-MMM-YYYY") : ""
          }
        />
      </Grid>
      <Grid item xs={12} lg={4} container></Grid>
      <Grid item xs={12} lg={4} container></Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Review Start Date"}
          value={
            review_start_date
              ? dayjs(review_start_date).format("DD-MMM-YYYY")
              : ""
          }
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
          value={
            review_completed_on
              ? dayjs(review_completed_on).format("DD-MMM-YYYY")
              : ""
          }
        />
      </Grid>
    </Grid>
  );
};
