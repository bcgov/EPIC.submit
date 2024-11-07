import { useAccount } from "@/store/accountStore";
import { Case, Switch } from "react-if";
import ProponentTableHead from "./ProponentTableHead";
import { USER_TYPE } from "@/models/User";

export default function TableHead() {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentTableHead />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <ProponentTableHead />
      </Case>
    </Switch>
  );
}
