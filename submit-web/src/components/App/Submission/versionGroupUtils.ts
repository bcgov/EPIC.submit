import {
  NonCanonicalPackageStatus,
  PackageStatus,
  PackageVersion,
} from "@/models/Package";

// NO_REVISION_REQUIRED is the proponent-facing (non-canonical) mapping of the
// SATISFIED status (see package_service._map_canonical_statuses), so the entity
// side must treat it as an eligible terminal success state too.
export const PROPONENT_CREATE_ELIGIBLE_STATUSES: (
  | PackageStatus
  | NonCanonicalPackageStatus
)[] = ["APPROVED", "ACCEPTED", "SATISFIED", "REVIEWED", "NO_REVISION_REQUIRED"];

/**
 * Determines whether the proponent user can create a new package version.
 * Button is visible only when:
 * 1. User is a proponent (not staff)
 * 2. User is viewing the latest package version
 * 3. Package status includes one of the terminal success states (APPROVED, ACCEPTED, SATISFIED, REVIEWED, NO_REVISION_REQUIRED)
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
  return packageStatus.some((status) =>
    PROPONENT_CREATE_ELIGIBLE_STATUSES.includes(status),
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
