import { SubmissionPackage } from "@/models/Package";
import { Grid, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { get, isArray } from "lodash";
import { useMemo } from "react";
import VersionGroup from "../VersionGroup";
import { ReactNode } from "@tanstack/react-router";
import { SubmissionHistory } from "./SubmissionHistory";

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
      <Grid item xs={12} lg={4} container>
        <Stack direction={"row"} spacing={2}>
          <Typography color={BCDesignTokens.themeGray70}>Condition:</Typography>
          <Typography color={"inherit"}>{condition}</Typography>
        </Stack>
      </Grid>

      <Grid item xs={12} lg={4} container>
        <Stack direction={"row"} spacing={2}>
          <Typography color={BCDesignTokens.themeGray70}>
            Supporting Conditions:
          </Typography>
          <Typography color={"inherit"}>{supportingConditions}</Typography>
        </Stack>
      </Grid>

      <Grid
        item
        xs={12}
        lg={4}
        container
        alignContent={{ xs: "flex-start", lg: "flex-end" }}
        justifyContent={{ xs: "flex-start", lg: "flex-end" }}
      >
        <Typography color={BCDesignTokens.themeGray70} sx={{ mr: 1 }}>
          Version:{" "}
        </Typography>
        <VersionGroup currentPackageVersion={version} />
      </Grid>
      <Grid item xs={12} container mt={"24px"}>
        <SubmissionHistory submissionPackageId={String(submissionPackage.id)} />
      </Grid>
    </Grid>
  );
};
