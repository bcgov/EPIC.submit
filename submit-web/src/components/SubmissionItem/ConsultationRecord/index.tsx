import * as yup from "yup";
import { Case, Switch } from "react-if";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { ConsultationRecordProponentView } from "./ConsultationRecordProponentView";
import { ConsultationRecordStaffView } from "./ConsultationRecordStaffView";

export const consultationRecordSchema = yup.object().shape({
  consultedParties: yup.array().of(
    yup.object().shape({
      consultedParty: yup.string(),
    })
  ),
  allPartiesConsulted: yup.string().required("Please answer this question."),
  planWasReviewed: yup.string().required("Please answer this question."),
  writtenExplanationsProvidedToParties: yup
    .string()
    .required("Please answer this question."),
  writtenExplanationsProvidedToCommenters: yup
    .string()
    .required("Please answer this question."),
  consultationRecords: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
});

export type ConsultationRecordForm = yup.InferType<
  typeof consultationRecordSchema
>;

export const ConsultationRecord = () => {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ConsultationRecordProponentView />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <ConsultationRecordStaffView />
      </Case>
    </Switch>
  );
};
