import { useAccount } from "@/store/accountStore";
import { Case, Switch } from "react-if";
import { USER_TYPE } from "@/models/User";
import ProponentLayoutHead from "./ProponentLayoutHead";
import StaffLayoutHead from "./StaffLayoutHead";

type LayoutTableHeadProps = {
  isManagementPlan?: boolean;
};

export default function LayoutTableHead({ isManagementPlan }: LayoutTableHeadProps) {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentLayoutHead isManagementPlan={isManagementPlan} />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffLayoutHead isManagementPlan={isManagementPlan} />
      </Case>
    </Switch>
  );
}
