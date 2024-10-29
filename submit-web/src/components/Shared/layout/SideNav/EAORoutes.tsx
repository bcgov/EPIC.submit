import { MainListItem } from "./MainListItem";
import { SubListItem } from "./SubListItem";

export default function EAORoutes() {
  return (
    <>
      <MainListItem
        route={{
          name: "Projects",
          path: "/projects",
        }}
      />
      <MainListItem
        route={{
          name: "Documents",
          path: "/documents",
        }}
      />
      <MainListItem
        route={{
          name: "Admin",
          path: "/profile",
        }}
      />
      <SubListItem
        key={`sub-list-user-management`}
        route={{
          name: "User Management",
          path: `/user-management`,
        }}
      />
    </>
  );
}
