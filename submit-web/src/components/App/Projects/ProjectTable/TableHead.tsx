import { useAccount } from "@/store/accountStore";
import { Case, Switch } from "react-if";
import ProponentTableHead from "./ProponentTableHead";
import { USER_TYPE } from "@/models/User";
import StaffTableHead from "./StaffTableHead";

type TableHeadProps = {
  isManagementPlan?: boolean;
};

export default function TableHead({ isManagementPlan }: TableHeadProps) {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentTableHead isManagementPlan={isManagementPlan} />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffTableHead isManagementPlan={isManagementPlan} />
      </Case>
    </Switch>
  );
}
