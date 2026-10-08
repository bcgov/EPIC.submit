import { LinearProgress, Typography, Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type DocumentLinkProps = {
  name: string | React.ReactNode;
  loading: boolean;
  onClick?: () => void;
  disabled?: boolean;
};
export const DocumentLink = ({
  name,
  loading,
  onClick = () => {},
  disabled = false,
}: DocumentLinkProps) => {
  if (loading) {
    return (
      <Typography
        variant="body2"
        color="inherit"
        component="span"
        sx={{ mx: 0.5, color: BCDesignTokens.iconsColorLink }}
      >
        Preparing your file..
        <LinearProgress sx={{ width: "250px" }} />
      </Typography>
    );
  }
  if (disabled) {
    return (
      <Typography component="span" color="text.disabled" sx={{ cursor: "default" }}>
        {name}
      </Typography>
    );
  }
  return <MuiLink onClick={onClick}>{name}</MuiLink>;
};
