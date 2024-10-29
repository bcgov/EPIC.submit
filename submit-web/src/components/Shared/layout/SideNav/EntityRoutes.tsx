import { MainListItem } from "./MainListItem";
import ProjectsSubRoutes from "./ProjectsSubRoutes";

export default function EntityRoutes() {
  return (
    <>
      <MainListItem
        route={{
          name: "All Projects",
          path: "/projects",
        }}
      />
      <ProjectsSubRoutes />
      <MainListItem
        route={{
          name: "Admin",
          path: "/profile",
        }}
      />
    </>
  );
}
