import * as yup from "yup";

export const managementPlanReviewSchema = yup.object().shape({
  staff: yup.object().shape({
    passedReview: yup.string().required("Staff decision is required"),
  }),
  manager: yup.object().shape({
    passedReview: yup.string().required("Manager decision is required"),
  }),
});

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
