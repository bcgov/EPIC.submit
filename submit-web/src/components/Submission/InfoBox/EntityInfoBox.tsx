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

export const EntityInfoBox = ({ submissionPackage }: InfoBoxProps) => {
  const { version } = submissionPackage;

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
        p: "16px 16px 16px 16px",
      }}
    >
      <Grid item xs={12} md={6} container>
        <Grid item xs={12}>
          <Stack direction={"row"} spacing={2}>
            <Typography color={BCDesignTokens.themeGray70}>
              Condition:
            </Typography>
            <Typography color={"inherit"}>{condition}</Typography>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Stack direction={"row"} spacing={2}>
            <Typography color={BCDesignTokens.themeGray70}>
              Supporting Conditions:
            </Typography>
            <Typography color={"inherit"}>{supportingConditions}</Typography>
          </Stack>
        </Grid>
      </Grid>

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
        <SubmissionHistory submissionPackageId={String(submissionPackage.id)} />
      </Grid>
    </Grid>
  );
};
