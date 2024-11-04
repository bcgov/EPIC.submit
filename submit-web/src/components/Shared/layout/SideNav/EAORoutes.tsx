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
      />
      <MainListItem
        route={{
          name: "Documents",
          path: "/staff/documents",
        }}
      />
      <MainListItem
        route={{
          name: "Admin",
          path: "/staff/profile",
        }}
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
