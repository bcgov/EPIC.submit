import { Backdrop, CircularProgress } from "@mui/material";

type SubmitLoaderBackdropProps = {
  isOpen: boolean;
};
export const SubmitLoaderBackdrop = ({ isOpen }: SubmitLoaderBackdropProps) => {
  return (
    <Backdrop
      sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
      open={isOpen}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};
