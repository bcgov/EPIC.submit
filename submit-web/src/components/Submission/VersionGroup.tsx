import { QUERY_KEY } from "@/hooks/api/constants";
import {
  getStaffSubmissionPackageById,
  getSubmissionPackageById,
  useGetPackageVersionsByOriginalPackageId,
} from "@/hooks/api/usePackages";
import { PackageVersion, SubmissionPackage } from "@/models/Package";
import {
  Backdrop,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";

type VersionGroupProps = Readonly<{
  currentPackageVersion: PackageVersion;
  proponent?: boolean;
}>;
export default function VersionGroup({
  currentPackageVersion,
  proponent = false,
}: VersionGroupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { projectId: accountProjectIdParam, submissionPackageId } = useParams({
    strict: false,
  });
  const packageId = Number(submissionPackageId);

  const navigate = useNavigate();
  const { data: packageVersions, isPending: isVersionsLoading } =
    useGetPackageVersionsByOriginalPackageId({
      originalPackageId: currentPackageVersion.original_package_id,
    });

  const queryClient = useQueryClient();
  const loadNewPackage = async (packageId: number) => {
    try {
      setIsLoading(true);
      await queryClient.ensureQueryData<SubmissionPackage>({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
        queryFn: () =>
          proponent
            ? getSubmissionPackageById({ packageId })
            : getStaffSubmissionPackageById({ packageId }),
      });
      navigate({
        to: `/${proponent ? "proponent" : "staff"}/projects/${accountProjectIdParam}/submission-packages/${packageId}`,
        replace: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  function handleUpdatePackageId(newPackageId: number) {
    loadNewPackage(newPackageId);
  }

  if (isVersionsLoading) {
    return (
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rectangular" width={35} height={35} />
        <Skeleton variant="rectangular" width={35} height={35} />
      </Stack>
    );
  }

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {packageVersions?.map((version) => (
        <Button
          key={version.id}
          color={packageId === version.package_id ? "primary" : "secondary"}
          sx={{
            p: 0,
            mr: 1,
            minWidth: `35px`,
          }}
          onClick={() => handleUpdatePackageId(version.package_id)}
        >
          {version.version}
        </Button>
      ))}
    </>
  );
}
