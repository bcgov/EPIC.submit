import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { ProjectsTable } from "./ProjectsTable";
import { BCDesignTokens } from "epic.theme";
import { useProponentStore } from "@/store/proponentStore";

export const OnboardedProjectsTable = () => {
  const onboardedProjects = useProponentStore((state) => state.onboardedProjects);
  const isLoading = useProponentStore((state) => state.isLoading);
  const isError = useProponentStore((state) => state.isError);

  const onboardedProjectsIds = onboardedProjects?.map(op => op.id);

  return (
    <>
      <BarBlueTitle title="Onboarded Project(s)/Works" bold={false} variant="h5" />
      <ProjectsTable
        projects={onboardedProjects}
        pendingProjectIds={onboardedProjectsIds}
        selectedProjectsIds={onboardedProjectsIds}
        readonly
        isLoading={isLoading}
        isError={isError}
        sx={{
          mt: BCDesignTokens.layoutMarginXxlarge,
          mb: BCDesignTokens.layoutMarginXxxlarge,
        }}
      />
    </>
  );
};
