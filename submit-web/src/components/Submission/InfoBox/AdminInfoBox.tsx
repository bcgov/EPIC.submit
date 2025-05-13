import { SubmissionPackage } from "@/models/Package";
import { Grid, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { get, isArray } from "lodash";
import { useMemo } from "react";
import VersionGroup from "../VersionGroup";
import { SubmissionHistory } from "./SubmissionHistory";

type InfoBoxProps = {
  submissionPackage: SubmissionPackage;
};
export const AdminInfoBox = ({ submissionPackage }: InfoBoxProps) => {
  const { version } = submissionPackage;

  const condition = useMemo(() => {
    if (!submissionPackage.meta) return "";
    const condition = get(submissionPackage, "meta.main_condition");

    return get(condition, "condition_number", "");
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
        p: "16px 16px 16px 16px",
      }}
    >
      <Grid item xs={6} container>
        <Grid item xs={12}>
          <Stack direction={"row"} spacing={2}>
            <Typography color={BCDesignTokens.themeGray70}>
              Condition:
            </Typography>
            <Typography color={"inherit"}>{condition}</Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} container>
          <Stack direction={"row"} spacing={2}>
            <Typography color={BCDesignTokens.themeGray70}>
              Supporting Condition(s):
            </Typography>
            <Typography color={"inherit"}>{supportingConditions}</Typography>
          </Stack>
        </Grid>
      </Grid>

      <Grid
        item
        xs={6}
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
