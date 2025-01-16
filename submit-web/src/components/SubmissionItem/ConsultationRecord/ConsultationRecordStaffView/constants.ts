import * as yup from "yup";

export const consultationSchema = yup.object().shape({
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
  update_request: yup
    .object()
    .when(
      ["staff.passedConsultationCheck", "manager.passedConsultationCheck"],
      (values: string[], schema: yup.AnyObject) => {
        const [staff, manager] = values;
        return staff === "NO" && manager !== "YES"
          ? schema.shape({
              reason: yup.string().required("Reason is required"),
              submission_item_ids: yup
                .array()
                .nullable()
                .required("Submission items are required")
                .of(yup.number())
                .min(1, "Please select at least one item"),
            })
          : schema;
      },
    ),
});

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
