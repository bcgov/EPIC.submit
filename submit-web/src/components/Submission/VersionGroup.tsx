import { Button, ButtonGroup } from "@mui/material";

export default function VersionGroup({
  updatePackageId,
}: {
  updatePackageId: number;
}) {
  return (
    <ButtonGroup>
      <Button>1</Button>
      <Button>2</Button>
      <Button>3</Button>
    </ButtonGroup>
  );
}
