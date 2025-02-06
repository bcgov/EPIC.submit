import { SubmissionPackage } from "@/models/Package";
import { useAccount } from "@/store/accountStore";
import { Case, Switch } from "react-if";
import { AdminInfoBox } from "./AdminInfoBox";
import { EntityInfoBox } from "./EntityInfoBox";
import { USER_TYPE } from "@/models/User";

type InfoBoxProps = {
  submissionPackage: SubmissionPackage;
};
export const InfoBox = ({ submissionPackage }: InfoBoxProps) => {
  const { userType } = useAccount();

  return (
    <Switch>
      <Case condition={userType === USER_TYPE.STAFF}>
        <AdminInfoBox submissionPackage={submissionPackage} />
      </Case>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <EntityInfoBox submissionPackage={submissionPackage} />
      </Case>
    </Switch>
  );
};
