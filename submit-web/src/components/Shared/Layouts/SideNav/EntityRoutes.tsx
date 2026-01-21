import { ACCOUNT_USER_PERMISSIONS, USER_MANAGEMENT_ROLE } from "@/models/Role";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { MainListItem } from "./MainListItem";
import ProjectsSubRoutes from "./ProjectsSubRoutes";
import { SubListItem } from "./SubListItem";
import { useAccount } from "@/store/accountStore";
import { When } from "react-if";

export default function EntityRoutes() {
  const account = useAccount();
  const isAdmin =
    account?.userManagementRole?.role_name ===
    USER_MANAGEMENT_ROLE.PROJECT_ADMIN;

  return (
    <>
      <MainListItem
        route={{
          name: "All Projects",
          path: "/proponent/projects",
        }}
      />
      <ProjectsSubRoutes />
      <When condition={isAdmin}>
        <MainListItem
          route={{
            name: "Admin",
            path: "/proponent/profile",
          }}
        />
      </When>
      <PermissionsGate scopes={[ACCOUNT_USER_PERMISSIONS.INVITE_USERS]}>
        <SubListItem
          key={`sub-list-user-management`}
          route={{
            name: "User Management",
            path: `/proponent/user-management`,
          }}
        />
      </PermissionsGate>
    </>
  );
}
