import { SubmissionPackage } from "@/models/Package";
import { Case, Switch } from "react-if";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import ProponentTableRow from "./ProponentTableRow";

interface ProjectRowProps {
  subPackage: SubmissionPackage;
}

export default function ProjectTableRow({ subPackage }: ProjectRowProps) {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentTableRow subPackage={subPackage} />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <ProponentTableRow subPackage={subPackage} />
      </Case>
    </Switch>
  );
}
