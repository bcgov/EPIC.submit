import * as yup from "yup";

export const consultationSchema = yup.object().shape({
  staff: yup.object().shape({
    passed: yup.string().required("Staff decision is required"),
  }),
  manager: yup.object().shape({
    passed: yup.string().required("Manager decision is required"),
  }),
});
