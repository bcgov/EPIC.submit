import {
  Grid,
  Divider,
  Typography,
  Box,
  AccordionSummary,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { SubmissionItem } from "@/models/SubmissionItem";
import { useMemo } from "react";
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
import { iemReviewSchema, RadioOptions } from "./constants";
import ActionButtons from "./ActionButtons";
import NotesSection from "../../NotesSection";
import { When } from "react-if";
import AddRequestSection from "../../AddRequestSection";
import { NotificationBox } from "./NotificationBox";
import { get } from "lodash";

type iemReviewForm = yup.InferType<typeof iemReviewSchema>;

const getAnswersByType = (
  review: SubmissionReview,
  type: SubmissionReviewEntryType
) => {
  if (!review?.entries) return {};
  return review.entries?.find((entry) => entry.type === type)?.entry;
};

export default function ReviewSection() {
  const { roles } = useAccount();
  const isStaff = useMemo(() => checkIfStaff(roles), [roles]);
  const isManager = useMemo(() => checkIfManager(roles), [roles]);

  const { submissionId: submissionItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey
  );

  const defaultValues = useMemo(() => {
    if (!submissionItem?.review) return undefined;

    const review = submissionItem.review;
    const staffAnswers = getAnswersByType(
      review,
      SUBMISSION_REVIEW_ENTRY_TYPE.STAFF_RECOMMENDATION
    );
    const managerAnswers = getAnswersByType(
      review,
      SUBMISSION_REVIEW_ENTRY_TYPE.MANAGER_CONFIRMATION
    );

    return {
      staff: {
        passedReview: get(staffAnswers, "passedReview", ""),
      },
      manager: {
        passedReview: get(managerAnswers, "passedReview", ""),
      },
      update_request: {
        reason: managerAnswers?.reason ?? staffAnswers?.reason ?? "",
        submission_item_types:
          managerAnswers?.submission_item_types ??
          staffAnswers?.submission_item_types ??
          [],
      },
    };
  }, [submissionItem]);

  const methods = useForm<iemReviewForm>({
    resolver: yupResolver(iemReviewSchema),
    mode: "onChange",
    defaultValues,
  });

  const { watch } = methods;

  // geet staff and manager answers
  const staffAnswer = watch("staff.passedReview");
  const managerAnswer = watch("manager.passedReview");

  const failedIEM =
    managerAnswer === RadioOptions.NO.value ||
    (staffAnswer === RadioOptions.NO.value &&
      managerAnswer !== RadioOptions.YES.value);

  const isFormDisabled =
    (isStaff &&
      submissionItem?.review?.status ===
        SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW) ||
    submissionItem?.review?.status === SUBMISSION_REVIEW_STATUS.APPROVED;

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
              Independent Environmental Monitor Terms of Engagement Review
            </Typography>
            <Divider
              sx={{
                bgcolor: BCDesignTokens.themeBlue60,
                width: 1,
                my: BCDesignTokens.layoutMarginXsmall,
                mb: BCDesignTokens.layoutMarginMedium,
              }}
            />
            <NotesSection />
            <Typography
              variant="body1"
              sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
            >
              Based on the above information, has the holder passed the review
              of the Independent Environmental Monitor Terms of Engagement?
            </Typography>

            <ControlledRadioGroup
              name="staff.passedReview"
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
              <SubmitRadio
                label={RadioOptions.YES_DEFAULT.label}
                value={RadioOptions.YES_DEFAULT.value}
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
                <ControlledRadioGroup name="manager.passedReview">
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
                  <SubmitRadio
                    label={RadioOptions.YES_DEFAULT.label}
                    value={RadioOptions.YES_DEFAULT.value}
                    disabled={isFormDisabled}
                  />
                </ControlledRadioGroup>
              </>
            </PermissionsGate>
            <When condition={failedIEM}>
              <AccordionSummary
                expandIcon={null}
                aria-controls="panel1-content"
                id="panel1-header"
                sx={[
                  {
                    py: 0,
                    borderRadius: "4px",
                    border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
                    background: BCDesignTokens.themeGold10,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  },
                ]}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "space-between",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                    width={"80%"}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#38598A",
                        mr: BCDesignTokens.layoutMarginSmall,
                        fontWeight: BCDesignTokens.typographyBoldBody,
                      }}
                    >
                      Update & Revision Requests
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
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
