import * as yup from "yup";

export const DropdownOptions = {
  YES: {
    label: "Yes, the holder has passed the Consultation Check",
    value: "YES",
  },
  NO: {
    label: "No, the holder has not passed the Consultation Check",
    value: "NO",
  },
  NOT_APPLICABLE: {
    label: "The Consultation Check is not applicable for this version",
    value: "NOT_APPLICABLE",
  },
};

export const consultationSchema = yup.lazy((value = {}) => {
  const staffDecision = value?.staff?.passedConsultationCheck;
  const managerDecision = value?.manager?.passedConsultationCheck;

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
      passedConsultationCheck: hasManagerDecision
        ? yup.string().notRequired()
        : yup.string().required("Staff decision is required"),
    }),
    manager: yup.object().shape({
      passedConsultationCheck: hasStaffDecision
        ? yup.string().notRequired()
        : yup.string().required("Manager decision is required"),
    }),
    update_request: updateRequestSchema,
  };

  return yup.object().shape(baseShape);
});
