import { LinearProgress, Typography, Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type DocumentLinkProps = {
  name: string | React.ReactNode;
  loading: boolean;
  onClick?: () => void;
};
export const DocumentLink = ({
  name,
  loading,
  onClick = () => {},
}: DocumentLinkProps) => {
  if (loading) {
    return (
      <Typography
        variant="body2"
        color="inherit"
        sx={{ mx: 0.5, color: BCDesignTokens.iconsColorLink }}
      >
        Preparing your file..
        <LinearProgress sx={{ width: "250px" }} />
      </Typography>
    );
  }
  return <MuiLink onClick={onClick}>{name}</MuiLink>;
};
