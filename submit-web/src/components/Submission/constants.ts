import * as yup from "yup";

export const updateRequestedSchema = yup.object().shape({
  UpdateRequested: yup.string().required("Update Requested is required"),
});

export const RadioOptions = {
  CR: {
    label: "Consultation Records(s)",
    value: "Consultation Records(s)",
  },
  MP: {
    label: "Management Plan & Supporting Documents",
    value: "Management Plan & Supporting Documents",
  },
};
