import { SubmissionPackage } from "@/models/Package";
import { ALL_PHASES, PHASE_ORDER } from "./constants";

export type ReportGroup = {
  phase: string;
  packages: SubmissionPackage[];
  // "All Phases" is always expanded and cannot be collapsed.
  isAlwaysExpanded: boolean;
};

const UNKNOWN_PHASE = ALL_PHASES;

/**
 * Returns the phase bucket for a report package, falling back to "All Phases"
 * when the obligation has no phase.
 */
const getPackagePhase = (pkg: SubmissionPackage): string => {
  const phase = pkg.project_report?.phase;
  return phase && phase.trim() ? phase : UNKNOWN_PHASE;
};

/**
 * Numeric ascending comparison on condition number, then subsection, so rows
 * sort 6.2 < 13.4 < 19.4 (not lexicographically).
 */
const compareByCondition = (a: SubmissionPackage, b: SubmissionPackage): number => {
  const aNum = a.project_report?.condition_number ?? Number.POSITIVE_INFINITY;
  const bNum = b.project_report?.condition_number ?? Number.POSITIVE_INFINITY;
  if (aNum !== bNum) {
    return aNum - bNum;
  }
  const aSub = Number(a.project_report?.condition_subsection ?? 0);
  const bSub = Number(b.project_report?.condition_subsection ?? 0);
  if (!Number.isNaN(aSub) && !Number.isNaN(bSub) && aSub !== bSub) {
    return aSub - bSub;
  }
  return 0;
};

/**
 * Returns the sort index for a phase: known phases follow PHASE_ORDER; unknown
 * phases are appended after the known ones (stable by insertion order).
 */
const phaseOrderIndex = (phase: string): number => {
  const index = PHASE_ORDER.indexOf(phase);
  return index === -1 ? PHASE_ORDER.length : index;
};

/**
 * Groups report packages by phase, dropping empty groups, ordering groups by
 * the canonical PHASE_ORDER (All Phases first), and sorting rows within each
 * group by condition number ascending.
 */
export const groupReportsByPhase = (
  reportPackages: SubmissionPackage[],
): ReportGroup[] => {
  const byPhase = new Map<string, SubmissionPackage[]>();

  for (const pkg of reportPackages) {
    const phase = getPackagePhase(pkg);
    const existing = byPhase.get(phase);
    if (existing) {
      existing.push(pkg);
    } else {
      byPhase.set(phase, [pkg]);
    }
  }

  const groups: ReportGroup[] = Array.from(byPhase.entries()).map(
    ([phase, packages]) => ({
      phase,
      packages: [...packages].sort(compareByCondition),
      isAlwaysExpanded: phase === ALL_PHASES,
    }),
  );

  groups.sort((a, b) => {
    const diff = phaseOrderIndex(a.phase) - phaseOrderIndex(b.phase);
    if (diff !== 0) {
      return diff;
    }
    return a.phase.localeCompare(b.phase);
  });

  return groups;
};

/**
 * Builds the screen-reader label for a phase group count badge, e.g.
 * "Construction, 5 reports/notifications" or "Closure, 1 report/notification".
 */
export const buildGroupCountAriaLabel = (phase: string, count: number): string => {
  const noun = count === 1 ? "report/notification" : "reports/notifications";
  return `${phase}, ${count} ${noun}`;
};
