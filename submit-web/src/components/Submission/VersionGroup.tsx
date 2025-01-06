import { Button } from "@mui/material";
import { useEffect } from "react";

export default function VersionGroup({
  packageId,
  updatePackageId,
}: {
  packageId: number;
  updatePackageId: (num: number) => void;
}) {
  useEffect(() => {
    // getPackageVersions(packageId);
  }, [packageId]);

  function handleUpdatePackageId(num: number) {
    //setup backdrop
    //update url
    updatePackageId(num);
  }

  return (
    <>
      <Button
        color={packageId === 1 ? "primary" : "secondary"}
        onClick={() => handleUpdatePackageId(1)}
      >
        1
      </Button>
      <Button
        color={packageId === 2 ? "primary" : "secondary"}
        onClick={() => handleUpdatePackageId(1)}
      >
        2
      </Button>
      <Button
        color={packageId === 3 ? "primary" : "secondary"}
        onClick={() => handleUpdatePackageId(1)}
      >
        3
      </Button>
    </>
  );
}
