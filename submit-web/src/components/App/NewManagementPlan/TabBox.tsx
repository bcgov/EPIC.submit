import { Box, BoxProps } from "@mui/material";
import { BarBlueTitle } from "../../Shared/Text/BarTitle";

type TabBoxProps = {
  title: string;
} & BoxProps;
export const TabBox = ({ title, children, ...rest }: TabBoxProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
      {...rest}
    >
      <BarBlueTitle title={title} bold />
      {children}
    </Box>
  );
};
