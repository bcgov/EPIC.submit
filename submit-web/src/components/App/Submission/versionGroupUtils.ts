import { PackageStatus, PackageVersion } from "@/models/Package";

export const PROPONENT_CREATE_ELIGIBLE_STATUSES: PackageStatus[] = [
  "APPROVED",
  "ACCEPTED",
  "SATISFIED",
  "REVIEWED",
];

/**
 * Determines whether the proponent user can create a new package version.
 * Button is visible only when:
 * 1. User is a proponent (not staff)
 * 2. User is viewing the latest package version
 * 3. Package status includes one of the terminal success states (APPROVED, ACCEPTED, SATISFIED)
 */
export function canProponentCreateNewVersion({
  isProponent,
  isLatestVersion,
  packageStatus,
}: {
  isProponent: boolean;
  isLatestVersion: boolean;
  packageStatus: PackageStatus[] | undefined;
}): boolean {
  if (!isProponent || !isLatestVersion) return false;
  if (!packageStatus) return false;
  return PROPONENT_CREATE_ELIGIBLE_STATUSES.some((status) =>
    packageStatus.includes(status),
  );
}

/**
 * Calculates whether the current package version is the latest version
 * based on the list of all package versions.
 */
export function calculateIsLatestVersion(
  packageVersions: PackageVersion[] | undefined,
  currentVersion: number,
): boolean {
  if (!packageVersions) return false;
  const latestVersion = Math.max(...packageVersions.map((v) => v.version));
  return currentVersion === latestVersion;
}
