import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";

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
          name: "Invitations",
          path: "/staff/invitations",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
    </>
  );
}
