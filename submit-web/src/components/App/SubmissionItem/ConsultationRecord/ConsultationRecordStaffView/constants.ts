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
      section_notes: yup.lazy((notesValue) => {
        if (!notesValue || typeof notesValue !== "object") {
          return yup.object().required("At least one section note is required");
        }
        // Validate each key in the section_notes object has a non-empty string
        const shape: Record<string, any> = {};
        Object.keys(notesValue).forEach((key) => {
          shape[key] = yup
            .string()
            .required("Request Note is required")
            .test(
              "not-empty",
              "Request Note is required",
              (val) => !!val && val.trim().length > 0,
            );
        });
        return yup.object().shape(shape);
      }),
      submission_item_types: yup
        .array()
        .of(yup.number())
        .min(1, "At least one section is required"),
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
