import { OptionType } from "@/components/Shared/ControlledFormFields/ControlledMultiSelect";
import { AccountProject } from "@/models/Project";

/** A single submission package as returned by the account packages endpoint. */
export interface AccountPackageDetails {
  id: number;
  name: string;
  original_package_id: number;
}

/** An account package group keyed by project, as returned by the account packages endpoint. */
export interface AccountPackageGroup {
  project_id: string | number;
  packages: AccountPackageDetails[];
}

/**
 * Build the "Collaborator - Specific Submissions" picker options.
 *
 * Each submission is labelled "Project: Submission Name" so that identically
 * named submissions across different projects can be told apart. Options are
 * sorted by project name and then by submission name so submissions from the
 * same project appear consecutively. When a package's project cannot be
 * resolved, the label falls back to the bare submission name.
 */
export function buildSubmissionPackageOptions(
  accountPackages: AccountPackageGroup[] | undefined,
  accountProjects: AccountProject[] | undefined,
): OptionType[] {
  if (!accountPackages?.length) {
    return [];
  }

  const projectNamesById = new Map<string, string>();
  (accountProjects ?? []).forEach((accountProject) => {
    const name = accountProject.project?.name;
    if (name) {
      projectNamesById.set(String(accountProject.project_id), name);
    }
  });

  const options = accountPackages.flatMap((group) => {
    const projectName = projectNamesById.get(String(group.project_id));
    return (group.packages ?? []).map((pkg) => ({
      value: String(pkg.original_package_id),
      label: projectName ? `${projectName}: ${pkg.name}` : pkg.name,
      // Retained for deterministic sorting; not part of OptionType.
      projectName: projectName ?? "",
      submissionName: pkg.name,
    }));
  });

  options.sort((a, b) => {
    const byProject = a.projectName.localeCompare(b.projectName);
    if (byProject !== 0) {
      return byProject;
    }
    return a.submissionName.localeCompare(b.submissionName);
  });

  return options.map(({ value, label }) => ({ value, label }));
}
