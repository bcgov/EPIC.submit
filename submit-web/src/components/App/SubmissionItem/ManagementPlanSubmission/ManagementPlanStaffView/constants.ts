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
    sublabel:
      "This version will be enforceable until the requested revision is submitted and reviewed successfully by the Management Plan Team",
    value: "revision_required",
  },
};

export const managementPlanReviewSchema = yup.lazy((value) => {
  const staffDecision = value?.staff?.passedReview;
  const managerDecision = value?.manager?.passedReview;

  const hasStaffDecision = !!staffDecision;
  const hasManagerDecision = !!managerDecision;

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
  };

  return yup.object().shape(baseShape);
});
