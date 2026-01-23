import { Button, Grid, Stack, Typography } from "@mui/material";
import { When } from "react-if";
import { useManagementPlanForm } from "./formStore";
import { theme } from "@/styles/theme";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { useNavigate, useParams } from "@tanstack/react-router";
import { SubmissionPackage } from "@/models/Package";
import { get } from "lodash";

export const ExistingPlanDetails = ({
  existingPlan,
}: {
  existingPlan: SubmissionPackage | undefined;
}) => {
  const { step, setStep, reset, formData } = useManagementPlanForm();
  const navigate = useNavigate();
  const { projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
  });

  const handleCancel = () => {
    navigate({
      to: `/proponent/projects/${projectId}`,
    });
    reset();
  };

  const handleBack = () => {
    setStep(Math.min(step - 1, 0));
  };

  const handleViewSubmission = () => {
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${existingPlan?.id}`,
    });
  };

  const mainCondition = formData.main_condition;
  const consultedParties = Array.isArray(
    mainCondition?.condition_attributes?.parties_required_to_be_consulted,
  )
    ? mainCondition?.condition_attributes?.parties_required_to_be_consulted
    : [];

  return (
    <Grid
      container
      sx={{
        padding: "16px 0px",
      }}
      spacing={3}
    >
      <Grid item xs={12}>
        <WarningBox gap={2}>
          <div style={{ marginBottom: "8px" }}>
            An existing submission for this condition has already been created.
          </div>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: "8px" }}>
              To view this existing submission, click "View Submission" below.
            </li>
            <li>
              To select a different condition, click "Back" to return to the
              previous page.
            </li>
          </ul>
        </WarningBox>
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="body1"
          fontWeight={theme.typography.fontWeightBold}
        >
          {get(mainCondition, "condition_attributes.deliverable_name[0]", "")}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="body2"
          fontWeight={theme.typography.fontWeightBold}
        >
          Condition{" "}
          {`${mainCondition?.condition_number} - ${mainCondition?.condition_name}`}
        </Typography>
      </Grid>
      <When
        condition={
          mainCondition?.condition_attributes?.requires_consultation === "true"
        }
      >
        <Grid item xs={12}>
          <Typography
            variant="body2"
            fontWeight={theme.typography.fontWeightBold}
          >
            Consultation Required
          </Typography>
        </Grid>
      </When>
      {consultedParties &&
        mainCondition?.condition_attributes?.requires_consultation ===
          "true" && (
          <Grid item xs={12}>
            <Typography
              variant="body2"
              fontWeight={theme.typography.fontWeightBold}
            >
              List of parties to be consulted:
            </Typography>
            <ul
              style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.body2.fontSize,
                fontStyle: theme.typography.body2.fontStyle,
                lineHeight: theme.typography.body2.lineHeight,
              }}
            >
              {consultedParties.map((stakeholder: string) => (
                <li key={stakeholder}>{stakeholder}</li>
              ))}
            </ul>
          </Grid>
        )}
      <Grid item xs={12}>
        <Stack direction={"row"} spacing={1}>
          <Button variant="text" onClick={handleCancel}>
            Cancel
          </Button>
          <Button color="secondary" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleViewSubmission}>View Submission</Button>
        </Stack>
      </Grid>
    </Grid>
  );
};
