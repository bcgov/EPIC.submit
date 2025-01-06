import { useGetPackageVersionsByPackageId } from "@/hooks/api/usePackages";
import { Backdrop, Button, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";

export default function VersionGroup({
  packageId,
  isPackageUpdating,
  updatePackageId,
}: {
  packageId: number;
  isPackageUpdating: boolean;
  updatePackageId: (newPackageId: number) => void;
}) {
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const [updatingPackageVersion, setUpdatingPackageVersion] = useState(false);
  const navigate = useNavigate();
  const { data: packageVersions } = useGetPackageVersionsByPackageId({
    packageId: packageId,
    enabled: Boolean(packageId),
  });

  function handleUpdatePackageId(newPackageId: number) {
    setUpdatingPackageVersion(true);
    updatePackageId(newPackageId);
    navigate({
      to: `/staff/projects/${accountProjectIdParam}/submission-packages/${newPackageId}`,
      replace: true,
    });
    setUpdatingPackageVersion(false);
  }

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={isPackageUpdating && updatingPackageVersion}
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
