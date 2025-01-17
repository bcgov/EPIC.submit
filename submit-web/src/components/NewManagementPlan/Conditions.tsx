import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  Link as MuiLink,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  Skeleton,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useManagementPlanForm } from "./formStore";
import { MANAGEMENT_PLAN_FORM_STEPS } from "./constants";
import CloseIcon from "@mui/icons-material/Close";
import { Unless } from "react-if";
import { useGetConditions } from "@/hooks/useConditions";
import { Condition } from "@/models/Condition";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";

const MAX_SUPPORTING_CONDITIONS = 4;
const NUM_STEPS = Object.keys(MANAGEMENT_PLAN_FORM_STEPS).length;
export const Conditions = () => {
  const { projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
  });
  const navigate = useNavigate();
  const { data: accountProject } = useGetAccountProject({
    accountProjectId: Number(projectId),
  });

  const { data: conditions, isLoading } = useGetConditions({
    projectId: accountProject?.project.epic_guid ?? "",
    includeAttributes: true,
  });

  const { step, setStep, reset, formData, setFormData } =
    useManagementPlanForm();

  const [mainCondition, setMainCondition] = useState<Condition | null>(
    formData?.main_condition || null,
  );

  const [supportingConditions, setSupportingConditions] = useState<number[]>(
    Array.from(formData.supporting_conditions || []).map(
      (condition: Condition) => condition.condition_number ?? 0,
    ),
  );
  const isConditionSelected = (condition: Condition) =>
    mainCondition?.condition_number === condition?.condition_number ||
    supportingConditions.some((c) => c === condition.condition_number);

  const [errorText, setErrorText] = useState<string | null>(null);

  const handleNext = () => {
    if (mainCondition == null || supportingConditions.includes(0)) {
      setErrorText("Please select a condition for each input");
      return;
    }
    setFormData({
      ...formData,
      main_condition: mainCondition,
      supporting_conditions: conditions?.filter((c) =>
        supportingConditions.includes(c.condition_number!),
      ),
    });

    setStep(Math.min(step + 1, NUM_STEPS - 1));
  };

  const handleCancel = () => {
    navigate({
      to: `/proponent/projects/${projectId}`,
    });
    reset();
  };

  useEffect(() => {
    setErrorText(null);
  }, [mainCondition, supportingConditions]);

  const handleAnotherSupportingCondition = (
    currentInput: number,
    conditionName: string,
  ) => {
    if (supportingConditions.length >= MAX_SUPPORTING_CONDITIONS) return;
    const newCondition = conditions?.find(
      (c) => c.condition_name === conditionName,
    );

    if (newCondition?.condition_number != null) {
      setSupportingConditions((prev) =>
        prev.map((c) =>
          c === currentInput ? newCondition.condition_number! : c,
        ),
      );
    }
  };

  const handleNewCondition = () => {
    if (supportingConditions.includes(0)) {
      setErrorText("Please select a condition for each input");
      return;
    }
    setSupportingConditions([...supportingConditions, 0]);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 400,
          color: BCDesignTokens.typographyColorPlaceholder,
        }}
      >
        Condition(s)
      </Typography>
      <Divider />
      <Grid
        container
        sx={{
          padding: "16px 0px",
        }}
      >
        <Grid item xs={12}>
          <Typography variant="body1">
            What condition is this management plan for?
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="body2"
            color={BCDesignTokens.typographyColorPlaceholder}
          >
            Please note: you can only submit one Management Plan per submission
          </Typography>
        </Grid>
        <Grid item xs md={6} lg={4}>
          <TextField
            select
            fullWidth
            sx={{ marginBottom: "10px" }}
            onChange={(e) => {
              setMainCondition(
                conditions?.find((c) => c.condition_name === e.target.value) ||
                  null,
              );
              if (errorText) {
                setErrorText(null);
              }
            }}
            value={mainCondition?.condition_name || ""}
          >
            {conditions?.map((condition) => (
              <MenuItem
                key={condition.condition_name || ""}
                value={condition.condition_name || ""}
                disabled={isConditionSelected(condition)}
              >
                {condition.condition_name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="body1"
            sx={{ marginTop: BCDesignTokens.layoutMarginMedium }}
          >
            What are the supporting conditions for this management plan?
          </Typography>
        </Grid>
        {supportingConditions.map((input) => (
          <Grid key={`input-${input}`} item xs={12} container spacing={1}>
            <Grid item xs md={6} lg={4} key={input}>
              {isLoading && !conditions ? (
                <Box width={300}>
                  <Skeleton animation="wave" />
                </Box>
              ) : (
                <TextField
                  select
                  fullWidth
                  sx={{ marginBottom: "10px" }}
                  onChange={(e) => {
                    handleAnotherSupportingCondition(input, e.target.value);
                    if (errorText) {
                      setErrorText(null);
                    }
                  }}
                  value={
                    conditions?.find((c) => c.condition_number === input)
                      ?.condition_name || ""
                  }
                >
                  {conditions?.map((condition) => (
                    <MenuItem
                      key={condition.condition_name || ""}
                      value={condition.condition_name || ""}
                      disabled={isConditionSelected(condition)}
                    >
                      {condition.condition_name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>

            <Grid item>
              <IconButton
                onClick={() => {
                  setSupportingConditions(
                    supportingConditions.filter((c) => c !== input),
                  );
                }}
              >
                <CloseIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Unless
          condition={supportingConditions.length >= MAX_SUPPORTING_CONDITIONS}
        >
          <Grid item xs={12}>
            <MuiLink
              sx={{
                cursor: "pointer",
              }}
              onClick={handleNewCondition}
            >
              + Add another condition
            </MuiLink>
          </Grid>
        </Unless>
      </Grid>
      {errorText && (
        <Grid item xs={12}>
          <Typography color="error" variant="body2">
            {errorText}
          </Typography>
        </Grid>
      )}
      <Grid container spacing={2} mt="5em">
        <Grid item>
          <Button variant="text" onClick={handleCancel}>
            Cancel
          </Button>
        </Grid>
        <Grid item>
          <Button onClick={handleNext}>Next</Button>
        </Grid>
      </Grid>
    </Box>
  );
};
