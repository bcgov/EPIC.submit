import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";
import { useHasRole } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

export default function EAORoutes() {
  // Configurations is restricted to users with full_access only.
  const hasFullAccess = useHasRole(EPIC_SUBMIT_ROLE.full_access);

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
          name: "Proponents/Holders",
          path: "/staff/proponents",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      {hasFullAccess && (
        <MainListItem
          route={{
            name: "Configurations",
            path: "/staff/configurations",
          }}
          sx={{ mb: BCDesignTokens.layoutMarginSmall }}
        />
      )}
    </>
  );
}
