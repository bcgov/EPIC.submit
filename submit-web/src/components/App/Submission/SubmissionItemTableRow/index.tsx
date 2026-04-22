import { Case, Switch } from "react-if";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import ProponentSubmissionItemTableRow from "./ProponentSubmissionItemTableRow";
import StaffSubmissionItemTableRow from "./StaffSubmissionItemTableRow";
import { SubmissionItem } from "@/models/SubmissionItem";
import { PackageType } from "@/models/Package";

export type SubmissionItemTableRowProps = Readonly<{
  item: SubmissionItem;
  error?: boolean;
  packageType: PackageType;
  onRequestUpdate?: (itemTypeId: number, itemTypeName: string) => void;
  hasPendingRequest?: boolean;
  hasSentRequest?: boolean;
}>;

export default function SubmissionItemTableRow({
  item,
  error = false,
  packageType,
  onRequestUpdate,
  hasPendingRequest,
  hasSentRequest,
}: SubmissionItemTableRowProps) {
  const { userType } = useAccount();

  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentSubmissionItemTableRow
          item={item}
          packageType={packageType}
          error={error}
        />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffSubmissionItemTableRow
          item={item}
          packageType={packageType}
          error={error}
          onRequestUpdate={onRequestUpdate}
          hasPendingRequest={hasPendingRequest}
          hasSentRequest={hasSentRequest}
        />
      </Case>
    </Switch>
  );
}
