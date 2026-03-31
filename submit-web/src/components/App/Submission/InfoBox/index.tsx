import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { Grid, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { get, isArray } from "lodash";
import { useMemo } from "react";
import VersionGroup from "@/components/App/Submission/VersionGroup";
import { SubmissionHistory } from "@/components/App/Submission/InfoBox/SubmissionHistory";
import { Else, If, Then } from "react-if";
import dateUtils from "@/utils/dateUtils";

type InfoBoxProps = {
  submissionPackage: SubmissionPackage;
};

export const InfoBox = ({ submissionPackage }: InfoBoxProps) => {
  const { version } = submissionPackage;

  const condition = useMemo(() => {
    if (!submissionPackage.meta) return "";
    const mainCondition = get(submissionPackage, "meta.main_condition");
    return get(mainCondition, "condition_number", "");
  }, [submissionPackage]);

  const supportingConditions = useMemo(() => {
    if (!submissionPackage.meta) return "";
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
        p: "16px",
      }}
    >
      <If condition={submissionPackage.type.name === SubmissionPackageType.IPD}>
        <Then>
          <Grid item xs={12} md={6} container direction={"column"}>
            <Grid item xs={12}>
              <Stack direction={"row"} spacing={2}>
                <Typography color={BCDesignTokens.themeGray70}>
                  Submitted on:
                </Typography>
                <Typography color={"inherit"}>
                  {dateUtils.formatDate(submissionPackage.submitted_on) || "-"}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack direction={"row"} spacing={2}>
                <Typography color={BCDesignTokens.themeGray70}>
                  Submitted by:
                </Typography>
                <Typography color={"inherit"}>
                  {submissionPackage.submitted_by || "-"}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Then>
        <Else>
          <Grid item xs={12} md={6} container>
            <Grid item xs={12}>
              <Stack direction={"row"} spacing={2}>
                <Typography color={BCDesignTokens.themeGray70}>
                  Condition:
                </Typography>
                <Typography color={"inherit"}>{condition || "-"}</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack direction={"row"} spacing={2}>
                <Typography color={BCDesignTokens.themeGray70}>
                  Supporting Condition(s):
                </Typography>
                <Typography color={"inherit"}>
                  {supportingConditions || "-"}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Else>
      </If>

      <Grid
        item
        md={6}
        xs={12}
        container
        alignContent={{ xs: "flex-start" }}
        justifyContent={{ xs: "flex-end" }}
      >
        <VersionGroup currentPackageVersion={version} />
      </Grid>
      <Grid item xs={12} container mt={"16px"}>
        <SubmissionHistory
          submissionPackageId={String(version.original_package_id)}
        />
      </Grid>
    </Grid>
  );
};
