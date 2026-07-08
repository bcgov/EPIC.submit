import * as yup from "yup";

export const DropdownOptions = {
  YES: {
    label: "Yes, the holder passed the Management Plan Review",
    value: "yes",
  },
  NO: {
    label: "No, the holder failed the Management Plan Review",
    value: "no",
  },
  YES_DEFAULT: {
    label: "Yes, by default",
    value: "yes_default",
  },
  REVISION_REQUIRED: {
    label: "The Holder has to provide a revision",
    value: "revision_required",
  },
};

export const managementPlanReviewSchema = yup.lazy((value) => {
  const staffDecision = value?.staff?.passedReview;
  const managerDecision = value?.manager?.passedReview;

  const hasStaffDecision = !!staffDecision;
  const hasManagerDecision = !!managerDecision;

  const noDecision =
    staffDecision === DropdownOptions.NO.value ||
    managerDecision === DropdownOptions.NO.value;

  const updateRequestSchema = noDecision
    ? yup.object().shape({
        reason: yup.string().required("Reason is required"),
        submission_item_types: yup
          .array()
          .nullable()
          .required("Submission items are required")
          .typeError("Submission items are required")
          .of(yup.number())
          .min(1, "Please select at least one item"),
      })
    : yup.object().strip(); // remove from validated object if not needed

  const baseShape: Record<string, any> = {
    staff: yup.object().shape({
      passedReview: hasManagerDecision
        ? yup.string().notRequired()
        : yup.string().required("Staff decision is required"),
    }),
    manager: yup.object().shape({
      passedReview: hasStaffDecision
        ? yup.string().notRequired()
        : yup.string().required("Manager decision is required"),
    }),
    update_request: updateRequestSchema,
  };

  return yup.object().shape(baseShape);
});
