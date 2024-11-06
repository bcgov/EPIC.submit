import { SubmissionPackage } from "@/models/Package";
import { Case, Switch } from "react-if";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import ProponentTableRow from "./ProponentTableRow";

interface ProjectRowProps {
  subPackage: SubmissionPackage;
  onSubmissionClick: (submissionId: number) => void;
}

export default function ProjectTableRow({
  subPackage,
  onSubmissionClick,
}: ProjectRowProps) {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentTableRow
          subPackage={subPackage}
          onSubmissionClick={onSubmissionClick}
        />
      </Case>
    </Switch>
  );
}
