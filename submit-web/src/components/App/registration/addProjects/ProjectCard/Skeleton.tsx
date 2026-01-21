import { Skeleton as MuiSkeleton } from "@mui/material";

const CARD_HEIGHT = 301;
const CARD_WIDTH = 380;

export const Skeleton = () => {
  return (
    <MuiSkeleton
      variant="rectangular"
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
    />
  );
};
