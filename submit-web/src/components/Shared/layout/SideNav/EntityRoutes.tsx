import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import PermissionsGate from "../../PermissionGate";
import { MainListItem } from "./MainListItem";
import ProjectsSubRoutes from "./ProjectsSubRoutes";
import { SubListItem } from "./SubListItem";

export default function EntityRoutes() {
  return (
    <>
      <MainListItem
        route={{
          name: "All Projects",
          path: "/proponent/projects",
        }}
      />
      <ProjectsSubRoutes />
      <MainListItem
        route={{
          name: "Admin",
          path: "/proponent/profile",
        }}
      />
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
