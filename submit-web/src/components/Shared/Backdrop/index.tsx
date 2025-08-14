import { Backdrop, CircularProgress } from "@mui/material";

type BackdropProps = {
  isLoading: boolean;
};
export const SubmitBackdrop = ({ isLoading }: BackdropProps) => {
  return (
    <Backdrop
      sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
      open={isLoading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};
