import {
  Box,
  Stack,
  StackProps,
  Typography,
  TypographyProps,
} from "@mui/material";
import { ReactNode } from "@tanstack/react-router";

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
    <Stack direction="row" alignItems={"center"} {...otherProps}>
      <Typography {...labelProps}>{label}:</Typography>
      <Box>
        <Typography color={"inherit"} {...valueProps}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
};
