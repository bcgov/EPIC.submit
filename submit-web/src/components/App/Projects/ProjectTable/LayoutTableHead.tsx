import { useAccount } from "@/store/accountStore";
import { Case, Switch } from "react-if";
import { USER_TYPE } from "@/models/User";
import ProponentLayoutHead from "./ProponentLayoutHead";
import StaffLayoutHead from "./StaffLayoutHead";

export default function LayoutTableHead() {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentLayoutHead />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffLayoutHead />
      </Case>
    </Switch>
  );
}
