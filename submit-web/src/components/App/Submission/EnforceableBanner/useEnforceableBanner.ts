import { useMemo } from "react";
import { PackageVersion } from "@/models/Package";

export type EnforceableBannerType = "enforceable" | "not-enforceable" | "none";

type EnforceableBannerParams = {
  packageVersions?: PackageVersion[];
  currentPackageVersion?: PackageVersion;
};

type EnforceableBannerResult = {
  /** Which banner (if any) applies to the current package version. */
  bannerType: EnforceableBannerType;
  /** True if bannerType !== "none" -- convenient for layout decisions like
   * collapsing margin above the banner slot. */
  hasBanner: boolean;
};

/**
 * Shared "eligible version" rule underlying both the proponent and staff
 * hooks below.
 *
 * A version is "eligible" if it is either approved (is_approved) or
 * enforceable (is_enforceable). Whichever eligible version is most recent
 * gets "enforceable"; every other version gets "not-enforceable". If there
 * are no eligible versions at all, the result falls back to
 * `emptyEligibleSetBannerType` (defaults to "none").
 *
 * This single rule reproduces every case in the spec:
 * - No enforceable, no approved versions -> set is empty -> falls back to
 *   `emptyEligibleSetBannerType` for every version (see the two hooks below
 *   for how proponent vs. staff differ here).
 * - No enforceable, one approved version -> "enforceable" on it,
 *   "not-enforceable" on everything else.
 * - No enforceable, multiple approved versions -> "enforceable" on the
 *   latest approved version, "not-enforceable" on the rest.
 * - One enforceable, no approved versions -> "enforceable" on the
 *   enforceable version, "not-enforceable" on the rest.
 * - One enforceable, one or many approved versions -> "enforceable" on
 *   whichever of (approved | enforceable) is most recent, "not-enforceable"
 *   on the rest of that set and on every non-eligible version.
 * - Multiple enforceable versions is not expected to happen; if it does, we
 *   fall back to the same "most recent eligible" rule and log a warning
 *   rather than throwing.
 *
 * NOTE: this assumes `packageVersions` is ordered from most recent to least
 * recent, as returned by useGetPackageVersionsByOriginalPackageId.
 */
const getBaseBannerType = ({
  packageVersions,
  currentPackageVersion,
  emptyEligibleSetBannerType = "none",
}: EnforceableBannerParams & {
  emptyEligibleSetBannerType?: EnforceableBannerType;
}): EnforceableBannerType => {
  if (!packageVersions || !currentPackageVersion) return "none";

  const enforceableVersions = packageVersions.filter((pv) => pv.is_enforceable);

  if (enforceableVersions.length > 1) {
    // eslint-disable-next-line no-console
    console.warn(
      "useEnforceableBanner: multiple enforceable versions found for this package; this should not be possible.",
    );
  }

  const eligibleVersions = packageVersions.filter(
    (pv) => pv.is_approved || pv.is_enforceable,
  );

  if (eligibleVersions.length === 0) return emptyEligibleSetBannerType;

  // Array is ordered most-recent-first, so the first match is the most
  // recent eligible (approved | enforceable) version.
  const mostRecentEligible = eligibleVersions[0];

  return currentPackageVersion.id === mostRecentEligible.id
    ? "enforceable"
    : "not-enforceable";
};

/**
 * Proponent-facing enforceable banner state -- see getBaseBannerType for the
 * full rule breakdown.
 */
export const useEnforceableBanner = ({
  packageVersions,
  currentPackageVersion,
}: EnforceableBannerParams): EnforceableBannerResult => {
  return useMemo(() => {
    const bannerType = getBaseBannerType({
      packageVersions,
      currentPackageVersion,
    });

    return { bannerType, hasBanner: bannerType !== "none" };
  }, [packageVersions, currentPackageVersion]);
};

/**
 * Staff-facing enforceable banner state. Differs from the proponent view in
 * two ways:
 *
 * 1. If a package has no eligible (approved | enforceable) versions at all
 *    -- e.g. a package type with no approval workflow, or one that simply
 *    hasn't been approved/enforced yet -- staff still treats every version
 *    as "not-enforceable" rather than showing no banner. Proponents aren't
 *    told a version is "not enforceable" if nothing has ever been
 *    enforceable, but staff need to see which versions have been superseded
 *    regardless.
 * 2. If the *current* package version is also the most recent version
 *    overall (currentPackageVersion.is_latest) and the above would result
 *    in "not-enforceable" -- i.e. this version simply hasn't been
 *    reviewed/approved/rejected yet, it's just awaiting review -- staff
 *    sees no banner at all instead. Older superseded/rejected versions
 *    still show "not-enforceable" as normal.
 */
export const useStaffEnforceableBanner = ({
  packageVersions,
  currentPackageVersion,
}: EnforceableBannerParams): EnforceableBannerResult => {
  return useMemo(() => {
    let bannerType = getBaseBannerType({
      packageVersions,
      currentPackageVersion,
      emptyEligibleSetBannerType: "not-enforceable",
    });

    if (bannerType === "not-enforceable" && currentPackageVersion?.is_latest) {
      bannerType = "none";
    }

    return { bannerType, hasBanner: bannerType !== "none" };
  }, [packageVersions, currentPackageVersion]);
};
