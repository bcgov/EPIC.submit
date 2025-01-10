import { SubmissionItemTableRow as SubmissionItemTableRowType } from "../types";
import { Case, Switch } from "react-if";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import ProponentSubmissionItemTableRow from "./ProponentSubmissionItemTableRow";
import StaffSubmissionItemTableRow from "./StaffSubmissionItemTableRow";

export type SubmissionItemTableRowProps = Readonly<{
  item: SubmissionItemTableRowType;
  error?: boolean;
}>;

export default function SubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { userType } = useAccount();

  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentSubmissionItemTableRow item={item} error={error} />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffSubmissionItemTableRow item={item} error={error} />
      </Case>
    </Switch>
  );
}
