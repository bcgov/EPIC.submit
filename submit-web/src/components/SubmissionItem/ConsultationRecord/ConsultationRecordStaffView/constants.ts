import * as yup from "yup";

export const RadioOptions = {
  YES: {
    label: "Yes, the holder has passed the Consultation Check",
    value: "YES",
  },
  NO: {
    label: "No, the holder has not passed the Consultation Check",
    value: "NO",
  },
};

export const consultationSchema = yup.lazy((value) => {
  const baseSchema = {
    staff: yup.object().shape({
      passedConsultationCheck: yup
        .string()
        .required("Staff decision is required"),
    }),
    manager: yup.object().shape({
      passedConsultationCheck: yup
        .string()
        .required("Manager decision is required"),
    }),
    update_request: yup.object().shape({}),
  };

  const no =
    value.staff.passedConsultationCheck === RadioOptions.NO.value ||
    value.manager.passedConsultationCheck === RadioOptions.NO.value;

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
