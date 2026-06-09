import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { ProjectsTable } from "./ProjectsTable";
import { BCDesignTokens } from "epic.theme";
import { useProponentStore } from "@/store/proponentStore";

export const OnboardedProjectsTable = () => {
  const onboardedEntries = useProponentStore((state) => state.onboardedEntries);
  const isLoading = useProponentStore((state) => state.isLoading);
  const isError = useProponentStore((state) => state.isError);

  const onboardedEntryIds = onboardedEntries?.map(e => e.id);

  return (
    <>
      <BarBlueTitle title="Onboarded Project(s)/Works" bold={false} variant="h5" />
      <ProjectsTable
        entries={onboardedEntries}
        pendingEntryIds={onboardedEntryIds}
        selectedEntryIds={onboardedEntryIds}
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
