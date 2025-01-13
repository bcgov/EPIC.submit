import { useGetPackageVersionsByPackageId } from "@/hooks/api/usePackages";
import { Backdrop, Button, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export default function VersionGroup({
  packageId,
  isPackageUpdating,
  updatePackageId,
  proponent = false,
}: {
  packageId: number;
  isPackageUpdating: boolean;
  updatePackageId: (newPackageId: number) => void;
  proponent?: boolean;
}) {
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const navigate = useNavigate();
  const { data: packageVersions } = useGetPackageVersionsByPackageId({
    packageId: packageId,
    enabled: Boolean(packageId),
  });
  const [showBackdrop, setShowBackdrop] = useState(false);

  useEffect(() => {
    if (showBackdrop && !isPackageUpdating) {
      setShowBackdrop(isPackageUpdating);
    }
  }, [isPackageUpdating, showBackdrop]);

  function handleUpdatePackageId(newPackageId: number) {
    setShowBackdrop(true);
    updatePackageId(newPackageId);
    navigate({
      to: `/${proponent ? "proponent" : "staff"}/projects/${accountProjectIdParam}/submission-packages/${newPackageId}`,
      replace: true,
    });
  }

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={showBackdrop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {packageVersions?.map((version) => (
        <Button
          key={version.id}
          color={packageId === version.package_id ? "primary" : "secondary"}
          sx={{
            p: 0,
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
