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
