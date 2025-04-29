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
import { Unless } from "react-if";
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

  const MAX_SUPPORTING_CONDITIONS = Math.min(4, (conditions?.length ?? 1) - 1);

  const { step, setStep, reset, formData, setFormData } =
    useManagementPlanForm();

  const [mainCondition, setMainCondition] = useState<Condition | null>(
    formData?.main_condition || null
  );

  const [supportingConditions, setSupportingConditions] = useState<number[]>(
    Array.from(formData.supporting_conditions || []).map(
      (condition: Condition) => condition.condition_number ?? 0
    )
  );

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
        supportingConditions.includes(c.condition_number!)
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
    index: number,
    conditionName: string
  ) => {
    if (supportingConditions.length > MAX_SUPPORTING_CONDITIONS) return;
    const newCondition = conditions?.find(
      (c) => c.condition_name === conditionName
    );

    if (newCondition?.condition_number != null) {
      setSupportingConditions((prevConditions) => {
        const updatedConditions = [...prevConditions];
        updatedConditions[index] =
          conditions?.find((c) => c.condition_name === conditionName)
            ?.condition_number ?? 0;
        return updatedConditions;
      });
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
      <BarBlueTitle title="Create New Submission" bold={false} />
      <Grid
        container
        sx={{
          padding: "16px 0px",
        }}
      >
        <Grid item xs={12}>
          <Typography variant="body1" fontWeight={"bold"}>
            What condition is this submission plan for?
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="body2"
            color={BCDesignTokens.typographyColorPlaceholder}
            mb={1}
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
                  null
              );
              if (errorText) {
                setErrorText(null);
              }
            }}
            value={mainCondition?.condition_name || ""}
          >
            {conditions
              ?.filter(
                (condition) =>
                  condition.condition_number !== null && // Ensure condition_number is not null
                  !supportingConditions.includes(condition.condition_number)
              )
              .map((condition) => {
                const conditionLabel = `Condition ${condition.condition_number} - ${condition.condition_name}`;

                return (
                  <MenuItem
                    key={condition.condition_name || ""}
                    value={condition.condition_name || ""}
                  >
                    {conditionLabel}
                  </MenuItem>
                );
              })}
          </TextField>
        </Grid>
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
                    if (errorText) {
                      setErrorText(null);
                    }
                  }}
                  value={
                    conditions?.find((c) => c.condition_number === input)
                      ?.condition_name || ""
                  }
                >
                  {conditions
                    ?.filter(
                      (condition) =>
                        condition.condition_number !==
                          mainCondition?.condition_number && // Exclude selected main condition
                        condition.condition_number !== null && // Ensure condition_number is not null
                        !supportingConditions.includes(
                          condition.condition_number
                        ) // Exclude conditions already selected
                    )
                    .map((condition) => (
                      <MenuItem
                        key={condition.condition_name || ""}
                        value={condition.condition_name || ""}
                      >
                        {`Condition ${condition.condition_number} - ${condition.condition_name}`}
                      </MenuItem>
                    ))}
                  {conditions?.find(
                    (c) =>
                      c.condition_name ===
                      (conditions?.find((c) => c.condition_number === input)
                        ?.condition_name || "")
                  ) && (
                    <MenuItem
                      key={
                        conditions?.find((c) => c.condition_number === input)
                          ?.condition_name || ""
                      }
                      value={
                        conditions?.find((c) => c.condition_number === input)
                          ?.condition_name || ""
                      }
                    >
                      {`Condition ${conditions?.find((c) => c.condition_number === input)?.condition_number} - ${conditions?.find((c) => c.condition_number === input)?.condition_name}`}
                    </MenuItem>
                  )}
                </TextField>
              )}
            </Grid>

            <Grid item>
              <IconButton
                onClick={() => {
                  setSupportingConditions(
                    supportingConditions.filter((c) => c !== input)
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
