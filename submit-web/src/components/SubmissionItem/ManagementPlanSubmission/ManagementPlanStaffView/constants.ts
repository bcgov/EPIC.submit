import * as yup from "yup";

export const RadioOptions = Object.freeze({
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
});

export const managementPlanReviewSchema = yup.lazy((value) => {
  const baseSchema = {
    staff: yup.object().shape({
      passedReview: yup.string().required("Staff decision is required"),
    }),
    manager: yup.object().shape({
      passedReview: yup.string().required("Manager decision is required"),
    }),
    update_request: yup.object().shape({}),
  };

  const no =
    value.staff.passedReview === RadioOptions.NO.value ||
    value.manager.passedReview === RadioOptions.NO.value;

  if (no) {
    return yup.object().shape({
      ...baseSchema,
      update_request: yup.object().shape({
        reason: yup.string().required("Reason is required"),
        submission_item_types: yup
          .array()
          .nullable()
          .required("Submission items are required")
          .typeError("Submission items are required")
          .of(yup.number())
          .min(1, "Please select at least one item"),
      }),
    });
  }

  return yup.object().shape(baseSchema);
});
