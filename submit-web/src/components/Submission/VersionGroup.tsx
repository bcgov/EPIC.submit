import { useGetPackageVersions } from "@/hooks/api/usePackages";
import { Button } from "@mui/material";
import { useEffect } from "react";

export default function VersionGroup({
  packageId,
  updatePackageId,
}: {
  packageId: number;
  updatePackageId: (num: number) => void;
}) {
  const { data: packageVersions } = useGetPackageVersions({
    packageId: packageId,
    enabled: Boolean(packageId),
  });

  useEffect(() => {
    console.log(packageId);
    console.log(packageVersions);
  }, [packageId, packageVersions]);

  function handleUpdatePackageId(num: number) {
    //setup backdrop
    //update url
    updatePackageId(num);
  }

  return (
    <>
      {packageVersions?.map((version) => (
        <Button
          key={version.id}
          onClick={() => handleUpdatePackageId(version.package_id)}
        >
          {version.version}
        </Button>
      ))}
    </>
  );
}
