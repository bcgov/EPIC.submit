import { NonWorkPackageMap } from "@/models/NonWorkPackageMap";
import { AccountProjectWork } from "@/models/Project";

/**
 * A Work/Phase filter option. `value` is the key sent to the API as `work_phase`:
 * `work:<track_work_id>` for works, `non_work:<CODE>` for non-work package maps.
 */
export type WorkPhaseOption = {
  value: string;
  label: string;
};

export const workPhaseKey = (workId: number) => `work:${workId}`;
export const nonWorkPhaseKey = (code: string) => `non_work:${code}`;

const formatLabel = (work: string, phase: string) =>
  [work, phase].filter(Boolean).join(" - ");

/** Build the Work/Phase options from the project's works and its eligible non-work package maps. */
export const buildWorkPhaseOptions = (
  accountProjectWorks: AccountProjectWork[] = [],
  nonWorkPackageMaps: NonWorkPackageMap[] = [],
): WorkPhaseOption[] => {
  const options = new Map<string, WorkPhaseOption>();

  accountProjectWorks.forEach((apw) => {
    const workId = apw.work?.id ?? apw.work_id;
    if (!workId) return;
    const phase = apw.work?.current_phase;
    const label = formatLabel(
      apw.work?.title ?? "",
      phase?.display_name || phase?.name || "",
    );
    if (label) {
      options.set(workPhaseKey(workId), { value: workPhaseKey(workId), label });
    }
  });

  nonWorkPackageMaps.forEach((packageMap) => {
    const value = nonWorkPhaseKey(packageMap.code);
    options.set(value, {
      value,
      label: formatLabel(packageMap.work_label, packageMap.phase_label),
    });
  });

  return Array.from(options.values());
};
