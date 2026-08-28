import { useMemo } from "react";
import { SubmissionPackage } from "@/models/Package";
import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItem,
} from "@/models/SubmissionItem";
import { useGetPackageVersionsByOriginalPackageId } from "@/hooks/api/usePackages";
import { calculateIsLatestVersion } from "@/components/App/Submission/versionGroupUtils";

interface UseContactInfoAlwaysEditableInput {
  item: SubmissionItem | undefined;
  submissionPackage: SubmissionPackage | undefined;
}

/**
 * Determines whether a submission item is the "Submission Contact Information"
 * item on the latest version of its package. Contact information can be edited
 * by both Entity (proponent) and EAO (staff) users in any package status, as
 * long as the package is the latest version.
 */
export function useContactInfoAlwaysEditable({
  item,
  submissionPackage,
}: UseContactInfoAlwaysEditableInput): boolean {
  const originalPackageId = submissionPackage?.version?.original_package_id;

  const { data: packageVersions } = useGetPackageVersionsByOriginalPackageId({
    originalPackageId,
    enabled: Boolean(originalPackageId),
  });

  return useMemo(() => {
    if (item?.type?.name !== SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION) {
      return false;
    }

    const currentVersion = submissionPackage?.version?.version;
    // A package without version info is treated as the only/latest version.
    if (currentVersion === undefined) return true;

    return calculateIsLatestVersion(packageVersions, currentVersion);
  }, [item?.type?.name, submissionPackage?.version?.version, packageVersions]);
}
