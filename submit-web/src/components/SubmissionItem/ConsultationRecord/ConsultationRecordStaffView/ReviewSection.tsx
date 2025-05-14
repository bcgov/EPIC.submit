import { Grid, Divider, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ActionButtons from "./ActionButtons";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { SubmissionItem } from "@/models/SubmissionItem";
import { useMemo } from "react";
import { consultationSchema, RadioOptions } from "./constants";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import {
  SUBMISSION_REVIEW_ENTRY_TYPE,
  SUBMISSION_REVIEW_STATUS,
  SubmissionReview,
  SubmissionReviewEntryType,
} from "@/models/SubmissionReview";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { useAccount } from "@/store/accountStore";
import PermissionsGate from "@/components/Shared/PermissionGate";
import {
  checkIfManager,
  checkIfStaff,
} from "@/components/Shared/PermissionGate/utils";
import { NotificationBox } from "./NotificationBox";
import NotesSection from "../../NotesSection";
import AddRequestSection from "../../AddRequestSection";
import { When } from "react-if";

type ConsultationForm = yup.InferType<typeof consultationSchema>;

const getAnswersByType = (
  review: SubmissionReview,
  type: SubmissionReviewEntryType,
) => {
  if (!review?.entries) return {};
  return review.entries?.find((entry) => entry.type === type)?.entry;
};

export default function ReviewSection() {
  const { roles } = useAccount();
  const isStaff = checkIfStaff(roles);
  const isManager = checkIfManager(roles);

  const { submissionId: submissionItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey,
  );

  const defaultValues = useMemo(() => {
    if (!submissionItem?.review) return undefined;

    const review = submissionItem.review;
    const staffAnswers = getAnswersByType(
      review,
      SUBMISSION_REVIEW_ENTRY_TYPE.STAFF_RECOMMENDATION,
    );
    const managerAnswers = getAnswersByType(
      review,
      SUBMISSION_REVIEW_ENTRY_TYPE.MANAGER_CONFIRMATION,
    );

    return {
      staff: {
        passedConsultationCheck: staffAnswers?.passedConsultationCheck
          ? String(staffAnswers.passedConsultationCheck)
          : "",
      },
      manager: {
        passedConsultationCheck: managerAnswers?.passedConsultationCheck
          ? String(managerAnswers.passedConsultationCheck)
          : "",
      },
      update_request: {
        reason: managerAnswers?.reason || staffAnswers?.reason || "",
        submission_item_types:
          managerAnswers?.submission_item_types ||
          staffAnswers?.submission_item_types ||
          [],
      },
    };
  }, [submissionItem]);

  const methods = useForm<ConsultationForm>({
    resolver: yupResolver(consultationSchema),
    mode: "onChange",
    defaultValues,
  });

  const { watch } = methods;

  // geet staff and manager answers
  const staffAnswer = watch("staff.passedConsultationCheck");
  const managerAnswer = watch("manager.passedConsultationCheck");

  const failedConsultationCheck =
    managerAnswer === RadioOptions.NO.value ||
    (staffAnswer === RadioOptions.NO.value &&
      managerAnswer !== RadioOptions.YES.value);

  const isFormDisabled =
    (isStaff &&
      submissionItem?.review?.status ===
        SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW) ||
    submissionItem?.review?.status === SUBMISSION_REVIEW_STATUS.APPROVED ||
    submissionItem?.review?.status === SUBMISSION_REVIEW_STATUS.REJECTED;

  return (
    <Grid item container>
      <Grid
        item
        xs={12}
        sx={{
          background: BCDesignTokens.themeBlue10,
          p: BCDesignTokens.layoutPaddingSmall,
        }}
      >
        <FormProvider {...methods}>
          <form>
            <Typography variant="h6" color={"#858A8C"}>
              Consultation Check
            </Typography>
            <Divider
              sx={{
                bgcolor: BCDesignTokens.themeBlue60,
                width: 1,
                my: BCDesignTokens.layoutMarginXsmall,
              }}
            />
            <Typography
              variant="body1"
              sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
            >
              Based on the above information, has the holder passed the
              Consultation Check?
            </Typography>

            <ControlledRadioGroup
              name="staff.passedConsultationCheck"
              hideError={isManager}
            >
              <SubmitRadio
                label={RadioOptions.YES.label}
                value={RadioOptions.YES.value}
                disabled={isFormDisabled || isManager}
              />
              <SubmitRadio
                label={RadioOptions.NO.label}
                value={RadioOptions.NO.value}
                disabled={isFormDisabled || isManager}
              />
            </ControlledRadioGroup>
            <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.extended_eao_edit]}>
              <>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
                >
                  MANAGER CONFIRMATION:
                </Typography>
                <ControlledRadioGroup name="manager.passedConsultationCheck">
                  <SubmitRadio
                    label={RadioOptions.YES.label}
                    value={RadioOptions.YES.value}
                    disabled={isFormDisabled}
                  />
                  <SubmitRadio
                    label={RadioOptions.NO.label}
                    value={RadioOptions.NO.value}
                    disabled={isFormDisabled}
                  />
                </ControlledRadioGroup>
              </>
            </PermissionsGate>
            <NotesSection />
            <When condition={failedConsultationCheck}>
              <AddRequestSection disabled={isFormDisabled} />
            </When>
            <NotificationBox />
            <ActionButtons />
          </form>
        </FormProvider>
      </Grid>
    </Grid>
  );
}
