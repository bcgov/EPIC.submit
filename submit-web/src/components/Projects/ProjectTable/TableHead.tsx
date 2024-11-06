import { useAccount } from "@/store/accountStore";
import { Case } from "react-if";
import ProponentTableHead from "./ProponentTableHead";
import { USER_TYPE } from "@/models/User";

export default function TableHead() {
  const { userType } = useAccount();
  return (
    <Case condition={userType === USER_TYPE.PROPONENT}>
      <ProponentTableHead />
    </Case>
  );
}
