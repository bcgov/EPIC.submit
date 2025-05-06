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
import { When } from "react-if";
import { useMemo, useState } from "react";
import { useManagementPlanForm } from "./formStore";
import { theme } from "@/styles/theme";
import WarningBox from "../Shared/WarningBox";
import { BCDesignTokens } from "epic.theme";
import { useNavigate, useParams } from "@tanstack/react-router";
import { NewManagementPlanForm } from "./types";
import { get } from "lodash";
import { SubmissionPackageType } from "../Shared/types";

const YES = "yes";
const NO = "no";

type NewPlanDetailsProps = {
  onSubmit: (formData: Partial<NewManagementPlanForm>) => void;
  setNewlyCreatedPlan: (newlyCreatedPlan: boolean) => void;
};

export const NewPlanDetails = ({
  onSubmit,
  setNewlyCreatedPlan,
}: NewPlanDetailsProps) => {
  const { step, setStep, reset, formData } = useManagementPlanForm();
  const [isCorrect, setIsCorrect] = useState<string>(YES);
  const navigate = useNavigate();
  const { projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
  });

  const handleIsCorrectChange = (
    event: React.ChangeEvent<HTMLInputElement>,
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
  const managementPlanName =
    get(formData, "main_condition.condition_attributes.deliverable_name[0]") ??
    get(formData, "main_condition.condition_name");

  const submissionPackageType = useMemo(() => {
    const type = get(formData, "main_condition.condition_attributes");
    if (get(type, "requires_iem_terms_of_engagement") === "true") {
      return SubmissionPackageType.IEM;
    }
    if (get(type, "requires_management_plan") === "true") {
      return SubmissionPackageType.MANAGEMENT_PLAN;
    }
    return undefined;
  }, [formData]);

  console.log(submissionPackageType);

  console.log(formData);

  const handleCreateSubmission = () => {
    setNewlyCreatedPlan(true);
    onSubmit({
      name: {
        label: managementPlanName || "",
        value: managementPlanName || "",
      },
      type: submissionPackageType,
      ...formData,
    });
  };

  const mainCondition = formData?.main_condition;
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
        <Typography variant="body2">This submission is:</Typography>
        <Typography
          variant="body1"
          fontWeight={theme.typography.fontWeightBold}
        >
          {managementPlanName}
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
        <FormControl sx={{ width: "100%" }}>
          <FormLabel sx={{ fontWeight: theme.typography.fontWeightBold }}>
            Is this correct?
          </FormLabel>
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
              "Back" button to go to the previous page. If you selected the
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
  );
};
