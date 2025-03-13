import { Grid, GridProps } from "@mui/material";
import { YellowBar } from "../Shared/YellowBar";

interface GridContainerProps extends GridProps {
  yellowBar?: boolean;
}

export const GridContainer = ({
  yellowBar,
  children,
  ...rest
}: GridContainerProps) => {
  return (
    <Grid
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      px={9.5}
      py={7}
      spacing={0}
      {...rest}
    >
      {yellowBar && (
        <Grid item xs={12}>
          <YellowBar />
        </Grid>
      )}
      {children}
    </Grid>
  );
};
