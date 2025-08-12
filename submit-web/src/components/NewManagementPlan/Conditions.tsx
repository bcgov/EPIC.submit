import { useEffect, useState } from "react";
import {
  Box,
  Button,
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
import { useGetConditions } from "@/hooks/useConditions";
import { Condition } from "@/models/Condition";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { BarBlueTitle } from "../Shared/Text/BarTitle";

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

  const [errorText, setErrorText] = useState<string | null>(null);

  const handleNext = () => {
    if (!mainCondition) {
      setErrorText("Please select a condition/document.");
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
  }, [mainCondition]);

  const handleAnotherSupportingCondition = (
    index: number,
    planName: string,
  ) => {
    const newCondition = conditions?.find((c) => c.plan_name === planName);

    if (newCondition?.condition_number != null) {
      setSupportingConditions((prevConditions) => {
        const updatedConditions = [...prevConditions];
        updatedConditions[index] =
          conditions?.find((c) => c.plan_name === planName)?.condition_number ??
          0;
        return updatedConditions;
      });
    }
  };

  const handleNewCondition = () => {
    if (supportingConditions.includes(0)) {
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
      <BarBlueTitle title="Create New Submission" bold fullWidth={false} />
      <Grid
        container
        sx={{
          marginTop: "32px",
        }}
      >
        <Grid item xs={12}>
          <Typography variant="body1" fontWeight={"bold"}>
            What condition is this submission for?
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="body2"
            color={BCDesignTokens.typographyColorPlaceholder}
            mb={1}
          >
            Please note: you can only submit one management plan per condition.
          </Typography>
        </Grid>
        <Grid item xs md={6} lg={4}>
          <TextField
            select
            fullWidth
            sx={{ marginBottom: "10px" }}
            onChange={(e) => {
              setMainCondition(
                conditions?.find((c) => c.plan_name === e.target.value) || null,
              );
              if (errorText) {
                setErrorText(null);
              }
            }}
            value={mainCondition?.plan_name || ""}
            error={!mainCondition && Boolean(errorText)}
          >
            {conditions
              ?.filter(
                (condition) =>
                  condition.condition_number !== null && // Ensure condition_number is not null
                  !supportingConditions.includes(condition.condition_number),
              )
              .map((condition) => {
                const conditionLabel = `Condition ${condition.condition_number} - ${condition.plan_name}`;

                return (
                  <MenuItem
                    key={condition.plan_name || ""}
                    value={condition.plan_name || ""}
                  >
                    {conditionLabel}
                  </MenuItem>
                );
              })}
          </TextField>
        </Grid>
        {errorText && (
          <Grid item xs={12} mb={"15px"}>
            <Typography color="error" variant="body2">
              {errorText}
            </Typography>
          </Grid>
        )}
        {supportingConditions.map((input, index) => (
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
                    handleAnotherSupportingCondition(index, e.target.value);
                  }}
                  value={
                    conditions?.find((c) => c.condition_number === input)
                      ?.plan_name || ""
                  }
                >
                  {conditions
                    ?.filter(
                      (condition) =>
                        condition.condition_number !==
                          mainCondition?.condition_number && // Exclude selected main condition
                        condition.condition_number !== null && // Ensure condition_number is not null
                        !supportingConditions.includes(
                          condition.condition_number,
                        ), // Exclude conditions already selected
                    )
                    .map((condition) => (
                      <MenuItem
                        key={condition.plan_name || ""}
                        value={condition.plan_name || ""}
                      >
                        {`Condition ${condition.condition_number} - ${condition.plan_name}`}
                      </MenuItem>
                    ))}
                  {conditions?.find(
                    (c) =>
                      c.plan_name ===
                      (conditions?.find((c) => c.condition_number === input)
                        ?.plan_name || ""),
                  ) && (
                    <MenuItem
                      key={
                        conditions?.find((c) => c.condition_number === input)
                          ?.plan_name || ""
                      }
                      value={
                        conditions?.find((c) => c.condition_number === input)
                          ?.plan_name || ""
                      }
                    >
                      {`Condition ${conditions?.find((c) => c.condition_number === input)?.condition_number} - ${conditions?.find((c) => c.condition_number === input)?.plan_name}`}
                    </MenuItem>
                  )}
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
      </Grid>
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
