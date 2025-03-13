import { LinkProps, Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type SubmitLinkProps = {
  disabled?: boolean;
} & LinkProps;

export const SubmitLink = (props: SubmitLinkProps) => {
  const { children, disabled, sx, onClick, ...rest } = props;
  if (disabled) {
    return children;
  }
  return (
    <MuiLink
      {...rest}
      onClick={onClick}
      sx={{
        color: BCDesignTokens.themeBlue90,
        textDecoration: "none",
        cursor: onClick ? "pointer" : "inherit",
        ...sx,
      }}
    >
      {children}
    </MuiLink>
  );
};
