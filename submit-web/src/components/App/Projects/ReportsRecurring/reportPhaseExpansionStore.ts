import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ReportPhaseExpansionState = {
  // Expanded phase names, keyed by project id.
  expandedByProject: Record<number, string[]>;
  togglePhase: (projectId: number, phase: string) => void;
};

/**
 * Remembers which Reports & Recurring Submissions phase groups a user has
 * expanded, per project, so the section looks the same when they navigate
 * away (e.g. into a report) and come back. Persisted to localStorage so it
 * also survives a page reload.
 */
export const useReportPhaseExpansionStore = create<ReportPhaseExpansionState>()(
  persist(
    (set) => ({
      expandedByProject: {},
      togglePhase: (projectId, phase) =>
        set((state) => {
          const current = state.expandedByProject[projectId] ?? [];
          const next = current.includes(phase)
            ? current.filter((p) => p !== phase)
            : [...current, phase];
          return {
            expandedByProject: { ...state.expandedByProject, [projectId]: next },
          };
        }),
    }),
    {
      name: "report-phase-expansion",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ expandedByProject: state.expandedByProject }),
    },
  ),
);

export const useIsPhaseExpanded = (projectId: number, phase: string) =>
  useReportPhaseExpansionStore(
    (state) => state.expandedByProject[projectId]?.includes(phase) ?? false,
  );
