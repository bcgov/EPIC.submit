import { ACCOUNT_USER_PERMISSIONS, USER_MANAGEMENT_ROLE } from "@/models/Role";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { MainListItem } from "./MainListItem";
import ProjectsSubRoutes from "./ProjectsSubRoutes";
import { SubListItem } from "./SubListItem";
import { useAccount } from "@/store/accountStore";
import { When } from "react-if";
import { BCDesignTokens } from "epic.theme";

export default function EntityRoutes() {
  const account = useAccount();
  const isAdmin =
    account?.userManagementRoles?.some(
      (r) => r.role_name === USER_MANAGEMENT_ROLE.PROJECT_ADMIN ||
             r.role_name === USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
    ) ?? false;

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
          name: "Documents",
          path: "/proponent/documents",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      <When condition={isAdmin}>
        <MainListItem
          route={{
            name: "Admin",
            path: "/proponent/profile",
          }}
        />
      </When>
      <PermissionsGate scopes={[ACCOUNT_USER_PERMISSIONS.INVITE_USERS]}>
        <>
          <MainListItem
            route={{
              name: "Account Settings",
              path: "/proponent/user-management",
            }}
          />
          <SubListItem
            key={`sub-list-user-management`}
            route={{
              name: "User Management",
              path: `/proponent/user-management`,
            }}
          />
        </>
      </PermissionsGate>
    </>
  );
}
