import { SubmissionPackage } from "@/models/Package";
import { Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { get, isArray } from "lodash";
import { useMemo } from "react";
import VersionGroup from "../VersionGroup";
import { ReactNode } from "@tanstack/react-router";
import dateUtils from "@/utils/dateUtils";

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
};

export const EntityInfoBox = ({ submissionPackage }: InfoBoxProps) => {
  const { submitted_on, date_review_completed, submitted_by } =
    submissionPackage.meta || {};

  const condition = useMemo(() => {
    return get(submissionPackage, "meta.main_condition.condition_number", "");
  }, [submissionPackage]);

  const supportingConditions = useMemo(() => {
    const conditions = get(submissionPackage, "meta.supporting_conditions");
    if (!conditions || !isArray(conditions)) return "";

    return conditions
      .map((condition) => condition.condition_number)
      .filter(Boolean)
      .join(", ");
  }, [submissionPackage]);

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
        container
        alignContent={"flex-end"}
        justifyContent={"flex-end"}
      >
        <Typography color={BCDesignTokens.themeGray70} sx={{ mr: 1 }}>
          Version:{" "}
        </Typography>
        <VersionGroup
          currentPackageVersion={submissionPackage.version}
          proponent
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Condition"} value={condition} />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Submitted on"}
          value={dateUtils.formatDate(submitted_on)}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Date Review Completed"}
          value={dateUtils.formatDate(date_review_completed)}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem
          label={"Supporting Conditions"}
          value={supportingConditions}
        />
      </Grid>
      <Grid item xs={12} lg={4} container>
        <InfoBoxItem label={"Submitted by"} value={submitted_by} />
      </Grid>
    </Grid>
  );
};
