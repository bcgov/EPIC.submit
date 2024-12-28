import { LinkProps, Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type SubmitLinkProps = {
  disabled?: boolean;
} & LinkProps;

export const SubmitLink = (props: SubmitLinkProps) => {
  const { children, disabled, sx, ...rest } = props;
  if (disabled) {
    return children;
  }
  return (
    <MuiLink
      {...rest}
      sx={{
        color: BCDesignTokens.themeBlue90,
        textDecoration: "none",
        ...sx,
      }}
    >
      {children}
    </MuiLink>
  );
};
