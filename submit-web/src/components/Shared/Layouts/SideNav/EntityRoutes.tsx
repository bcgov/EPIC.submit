import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { MainListItem } from "./MainListItem";
import ProjectsSubRoutes from "./ProjectsSubRoutes";
import { BCDesignTokens } from "epic.theme";

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
          name: "Documents",
          path: "/proponent/documents",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      <PermissionsGate scopes={[ACCOUNT_USER_PERMISSIONS.INVITE_USERS]}>
        <>
          <MainListItem
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
