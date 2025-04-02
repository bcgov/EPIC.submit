import { QUERY_KEY } from "@/hooks/api/constants";
import {
  getStaffSubmissionPackageById,
  getSubmissionPackageById,
  useGetPackageVersionsByOriginalPackageId,
} from "@/hooks/api/usePackages";
import { PackageVersion, SubmissionPackage } from "@/models/Package";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
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
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";

type VersionGroupProps = Readonly<{
  currentPackageVersion: PackageVersion;
}>;
export default function VersionGroup({
  currentPackageVersion,
}: VersionGroupProps) {
  const { userType } = useAccount();
  const isProponent = userType === USER_TYPE.PROPONENT;
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
          isProponent
            ? getSubmissionPackageById({ packageId })
            : getStaffSubmissionPackageById({ packageId }),
      });
      navigate({
        to: `/${isProponent ? "proponent" : "staff"}/projects/${accountProjectIdParam}/submission-packages/${packageId}`,
        replace: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  function handleUpdatePackageId(newPackageId: number) {
    loadNewPackage(newPackageId);
  }

  const last_approved_package_version = packageVersions?.find(
    (packageVersion) => packageVersion.is_approved,
  );

  if (isVersionsLoading) {
    return (
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rectangular" width={35} height={35} />
        <Skeleton variant="rectangular" width={35} height={35} />
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1}>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {packageVersions?.map((packageVersion) => (
        <Button
          key={packageVersion.id}
          color={
            packageId === packageVersion.package_id ? "primary" : "secondary"
          }
          sx={{
            width: "auto",
          }}
          onClick={() => handleUpdatePackageId(packageVersion.package_id)}
          startIcon={
            packageVersion.id === last_approved_package_version?.id ? (
              <GppGoodOutlinedIcon />
            ) : undefined
          }
        >
          Package {packageVersion.version}
        </Button>
      ))}
    </Stack>
  );
}
