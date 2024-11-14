import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";
import { SubListItem } from "./SubListItem";

export default function EAORoutes() {
  return (
    <>
      <MainListItem
        route={{
          name: "Projects",
          path: "/staff/projects",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      <MainListItem
        route={{
          name: "Documents",
          path: "/staff/documents",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      <MainListItem
        route={{
          name: "Admin",
          path: "/staff/profile",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      <SubListItem
        key={`sub-list-user-management`}
        route={{
          name: "User Management",
          path: `/staff/user-management`,
        }}
      />
    </>
  );
}
