import { LinearProgress, Typography, Link as MuiLink } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type DocumentLinkProps = {
  name: string;
  loading: boolean;
  openDocument: () => void;
};
export const DocumentLink = ({
  name,
  loading,
  openDocument,
}: DocumentLinkProps) => {
  if (loading) {
    return (
      <Typography
        variant="body2"
        color="inherit"
        sx={{ mx: 0.5, color: BCDesignTokens.iconsColorLink }}
      >
        Preparing your file..
        <LinearProgress />
        <span style={{ visibility: "hidden" }}>{name}</span>
        {/* This span is to ensure the loading text doesn't collapse */}
      </Typography>
    );
  }
  return <MuiLink onClick={openDocument}>{name}</MuiLink>;
};
