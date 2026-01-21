import { Case, Switch } from "react-if";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { ConsultationRecordProponentView } from "./ConsultationRecordProponentView";
import { ConsultationRecordStaffView } from "./ConsultationRecordStaffView";

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
