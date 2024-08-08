import { Grid, GridProps } from "@mui/material";

export const PageGrid = ({ children, ...rest }: GridProps) => {
  return (
    <Grid container spacing={2} padding={15} {...rest}>
      {children}
    </Grid>
  );
};
