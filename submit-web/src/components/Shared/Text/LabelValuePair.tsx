import {
  Box,
  Stack,
  StackProps,
  Typography,
  TypographyProps,
} from "@mui/material";
import type { ReactNode } from "react";

type LabelValuePairProps = {
  label?: string;
  value?: ReactNode;
  labelProps?: TypographyProps;
  valueProps?: TypographyProps;
};
export const LabelValuePair = ({
  label = "",
  value = "",
  labelProps = {},
  valueProps = {},
  ...otherProps
}: LabelValuePairProps & StackProps) => {
  return (
    <Stack
      direction="row"
      {...otherProps}
      sx={[{
        alignItems: "center"
      }, ...(Array.isArray(otherProps.sx) ? otherProps.sx : [otherProps.sx])]}>
      <Typography {...labelProps}>{label}:</Typography>
      <Box>
        <Typography
          {...valueProps}
          sx={[{
            color: "inherit"
          }, ...(Array.isArray(valueProps.sx) ? valueProps.sx : [valueProps.sx])]}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
};
