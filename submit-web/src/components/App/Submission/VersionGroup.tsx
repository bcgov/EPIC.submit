import { QUERY_KEY } from "@/hooks/api/constants";
import {
  getStaffSubmissionPackageById,
  getSubmissionPackageById,
  useGetPackageVersionsByOriginalPackageId,
  useCreateNewPackageVersion,
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
import { useState, useMemo } from "react";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import AddIcon from "@mui/icons-material/Add";
import { useModal } from "@/components/Shared/Modals/modalStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { usePackageTableStore } from "./packageTableStore";

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
  const { setOpen: setOpenModal } = useModal();

  const navigate = useNavigate();
  const { reset } = usePackageTableStore();
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

  const { mutate: createNewPackageVersion } = useCreateNewPackageVersion({
    onSuccess: (newPackage) => {
      notify.success("New package created successfully");

      // Invalidate the old package so it's refetched when revisited
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
      });

      loadNewPackage(newPackage.id);
    },
    onError: () => {
      notify.error("Failed to create new package");
    },
  });

  function handleUpdatePackageId(newPackageId: number) {
    reset();
    loadNewPackage(newPackageId);
  }

  const handleCreateNewPackage = () => {
    setOpenModal(
      <ConfirmationModal
        title="New Submission Package"
        description={
          "This option will create another package so the Holder can resubmit documents. If a review is in progress, it will be cancelled, and the review will have to start over again when the Holder submits a new package.\nDo you want to cancel the current review and create a new package?"
        }
        confirmText="Create New Package"
        onConfirm={() => {
          createNewPackageVersion({
            originalPackageId: currentPackageVersion.original_package_id,
            data: {
              ...currentPackageVersion,
              package_id: packageId,
            },
          });
        }}
      />,
    );
  };

  const last_approved_package_version = packageVersions?.find(
    (packageVersion) => packageVersion.is_approved,
  );

  const isLatestVersion = useMemo(() => {
    if (!packageVersions) return false;
    const latestVersion = Math.max(...packageVersions.map((v) => v.version));
    return currentPackageVersion.version === latestVersion;
  }, [packageVersions, currentPackageVersion.version]);

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
      {!isProponent && isLatestVersion && (
        <Button
          color="secondary"
          sx={{
            width: "auto",
          }}
          onClick={handleCreateNewPackage}
          startIcon={<AddIcon />}
        >
          New
        </Button>
      )}
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
