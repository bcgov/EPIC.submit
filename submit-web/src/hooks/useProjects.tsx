import { useQuery } from "@tanstack/react-query";

const dummyProjects = [
  {
    id: "1",
    name: "Project 1",
    description: "Description 1",
  },
];
const loadProjectsByProponentId = (proponentId?: string) => {
  return Promise.resolve(dummyProjects);
};

export const useLoadProjectsByProponentId = (proponentId?: string) => {
  return useQuery({
    queryKey: ["projects", proponentId],
    queryFn: () => loadProjectsByProponentId(proponentId),
    enabled: Boolean(proponentId),
    retry: false,
  });
};
