import { useGetPackageVersions } from "@/hooks/api/usePackages";
import { Button } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

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
          color={packageId === version.package_id ? "primary" : "secondary"}
          sx={{
            p: BCDesignTokens.layoutPaddingSmall,
            minWidth: `${BCDesignTokens.layoutPaddingXsmall}px`,
          }}
          onClick={() => handleUpdatePackageId(version.package_id)}
        >
          {version.version}
        </Button>
      ))}
    </>
  );
}
