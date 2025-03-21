import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Link,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { TabBox } from "./TabBox";
import { When } from "react-if";
import { useState } from "react";
import { useManagementPlanForm } from "./formStore";
import { theme } from "@/styles/theme";
import { NewManagementPlanForm } from "./types";
import WarningBox from "../Shared/WarningBox";
import { BCDesignTokens } from "epic.theme";
import { useNavigate, useParams } from "@tanstack/react-router";

const YES = "yes";
const NO = "no";

type PlanDetailsProps = {
  onSubmit: (formData: NewManagementPlanForm) => void;
};
export const PlanDetails = ({ onSubmit }: PlanDetailsProps) => {
  const { step, setStep, reset, formData } = useManagementPlanForm();
  const [isCorrect, setIsCorrect] = useState<string>(YES);
  const navigate = useNavigate();
  const { projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
  });
  const handleIsCorrectChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsCorrect(event.target.value);
  };

  const handleCancel = () => {
    navigate({
      to: `/proponent/projects/${projectId}`,
    });
    reset();
  };

  const handleBack = () => {
    setStep(Math.min(step - 1, 0));
  };

  const mainCondition = formData.main_condition;
  const consultedParties = Array.isArray(mainCondition?.condition_attributes?.parties_required_to_be_consulted)
    ? mainCondition?.condition_attributes?.parties_required_to_be_consulted
    : [];
  const handleCreateSubmission = () => {
    const managementPlanName =
      mainCondition?.condition_attributes?.deliverable_name[0] ||
      mainCondition.condition_name;
    onSubmit({
      name: {
        label: managementPlanName || "",
        value: managementPlanName || "",
      },
      ...formData,
    });
  };
  return (
    <TabBox title="Plan Details">
      <Grid
        container
        sx={{
          padding: "16px 0px",
        }}
        spacing={4}
      >
        <Grid item xs={12}>
          <Typography variant="body2">
            You are submitting this Management Plan:
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="body1"
            fontWeight={theme.typography.fontWeightBold}
          >
            {mainCondition?.condition_attributes?.deliverable_name[0]}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="body2"
            fontWeight={theme.typography.fontWeightBold}
          >
            Condition {`${mainCondition.condition_number} - ${mainCondition.condition_name}`}
          </Typography>
        </Grid>
        <When
          condition={
            mainCondition?.condition_attributes?.requires_consultation ===
            "true"
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
        {consultedParties && (
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
                fontWeight: theme.typography.fontWeightBold,
              }}
            >
              {consultedParties.map((stakeholder: string) => (
                <li key={stakeholder}>{stakeholder}</li>
              ))}
            </ul>
          </Grid>
        )}
        <Grid item xs={12}>
          <FormControl sx={{ width: "100%" }}>
            <FormLabel>Is this correct?</FormLabel>
            <RadioGroup
              sx={{ mb: BCDesignTokens.layoutMarginSmall }}
              name="isCorrect"
              value={isCorrect}
              onChange={handleIsCorrectChange}
            >
              <FormControlLabel
                value={YES}
                control={<Radio />}
                label="Yes, this information is correct"
              />
              <FormControlLabel
                value={NO}
                control={<Radio />}
                label="No, this information is incorrect"
              />
            </RadioGroup>
            {isCorrect === NO && (
              <WarningBox>
                If you need to select a different condition, please click the
                “Back” button to go to the previous page. If you selected the
                correct condition but the information displayed is incorrect for
                that condition, please contact the EAO at
                <Link
                  href="mailto:EAO.ManagementPlanSupport@gov.bc.ca"
                  sx={{ ml: BCDesignTokens.layoutMarginXsmall }}
                >
                  EAO.ManagementPlanSupport@gov.bc.ca.
                </Link>
              </WarningBox>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Stack direction={"row"} spacing={1}>
            <Button variant="text" onClick={handleCancel}>
              Cancel
            </Button>
            <Button color="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleCreateSubmission}>Create Submission</Button>
          </Stack>
        </Grid>
      </Grid>
    </TabBox>
  );
};
