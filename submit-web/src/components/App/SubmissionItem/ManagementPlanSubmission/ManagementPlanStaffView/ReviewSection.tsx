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
import { managementPlanReviewSchema, DropdownOptions } from "./constants";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionPackage } from "@/models/Package";
import ActionButtons from "./ActionButtons";
import NotesSection from "@/components/App/SubmissionItem/NotesSection";
import { When } from "react-if";
import AddRequestSection from "@/components/App/SubmissionItem/AddRequestSection";
import { NotificationBox } from "./NotificationBox";
import UndoTMRecommendationButton from "@/components/App/SubmissionItem/UndoTMRecommendationButton";
import ControlledSelect from "@/components/Shared/ControlledFormFields/ControlledSelect";

type managementPlanReviewForm = yup.InferType<
  typeof managementPlanReviewSchema
>;

const getAnswersByType = (
  review: SubmissionReview,
  type: SubmissionReviewEntryType,
) => {
  if (!review?.entries) return {};
  return review.entries?.find((entry) => entry.type === type)?.entry;
};

export default function ReviewSection() {
  const { roles } = useAccount();
  const isStaff = useMemo(() => checkIfStaff(roles), [roles]);
  const isManager = useMemo(() => checkIfManager(roles), [roles]);

  const { submissionId: submissionItemId, submissionPackageId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey,
  );
  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getStaffSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
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
        passedReview: staffAnswers?.passedReview ?? "",
      },
      manager: {
        passedReview: managerAnswers?.passedReview ?? "",
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

  const methods = useForm<managementPlanReviewForm>({
    resolver: yupResolver(managementPlanReviewSchema),
    mode: "onChange",
    defaultValues,
  });

  const { watch } = methods;

  // geet staff and manager answers
  const staffAnswer = watch("staff.passedReview");
  const managerAnswer = watch("manager.passedReview");

  const failedManagementPlan =
    managerAnswer === DropdownOptions.NO.value ||
    (staffAnswer === DropdownOptions.NO.value &&
      managerAnswer !== DropdownOptions.YES.value);

  const isFormDisabled =
    (isStaff &&
      submissionItem?.review?.status ===
        SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW) ||
    submissionItem?.review?.status === SUBMISSION_REVIEW_STATUS.APPROVED ||
    submissionItem?.review?.status === SUBMISSION_REVIEW_STATUS.REJECTED ||
    submissionItem?.review?.status ===
      SUBMISSION_REVIEW_STATUS.REVISION_REQUIRED;

  const dropdownOptions = [
    { value: DropdownOptions.YES.value, label: DropdownOptions.YES.label },
    { value: DropdownOptions.NO.value, label: DropdownOptions.NO.label },
    {
      value: DropdownOptions.YES_DEFAULT.value,
      label: DropdownOptions.YES_DEFAULT.label,
    },
    {
      value: DropdownOptions.REVISION_REQUIRED.value,
      label: DropdownOptions.REVISION_REQUIRED.label,
      sublabel: DropdownOptions.REVISION_REQUIRED.sublabel,
    },
  ];

  return (
    <Grid item container data-testid="review-section">
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
              Management Plan Review
            </Typography>
            <Divider
              sx={{
                bgcolor: BCDesignTokens.themeBlue60,
                width: 1,
                my: BCDesignTokens.layoutMarginXsmall,
                mb: BCDesignTokens.layoutMarginMedium,
              }}
            />
            <Typography
              variant="body1"
              sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
            >
              Based on the above information, has the holder passed the
              Management Plan Review for the {submissionPackage?.name}?
            </Typography>
            <ControlledSelect
              name="staff.passedReview"
              placeholder="Select an option..."
              options={dropdownOptions}
              disabled={isFormDisabled || isManager}
              clearable={false}
              sx={{ width: "50%", mt: 1, mb: 0 }}
            />
            <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.mp_extended_edit]}>
              <>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
                >
                  MANAGER CONFIRMATION:
                </Typography>
                <ControlledSelect
                  name="manager.passedReview"
                  placeholder="Select an option..."
                  options={dropdownOptions}
                  disabled={isFormDisabled}
                  clearable={false}
                  sx={{ width: "50%", mt: 1, mb: 0 }}
                />
              </>
            </PermissionsGate>
            <UndoTMRecommendationButton submissionItem={submissionItem} />
            <When condition={failedManagementPlan}>
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
            <NotesSection />
            <NotificationBox />
            <ActionButtons />
          </form>
        </FormProvider>
      </Grid>
    </Grid>
  );
}
