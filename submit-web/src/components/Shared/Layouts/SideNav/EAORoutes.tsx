import { BCDesignTokens } from "epic.theme";
import { MainListItem } from "./MainListItem";

export default function EAORoutes() {
  return (
    <>
      <MainListItem
        route={{
          name: "Submission Review",
          path: "/staff/projects",
        }}
        sx={{ mb: BCDesignTokens.layoutMarginSmall }}
      />
      <MainListItem
        route={{
          name: "Document Library",
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
    </>
  );
}
