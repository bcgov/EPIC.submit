import { styled, TableCell, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const StyledProjectTableRow = styled(TableRow)(() => ({
  my: 1,
  "&:hover": {
    backgroundColor: BCDesignTokens.surfaceColorMenusHover,
  },
  cursor: "pointer",
}));

export const StyledProjectTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
  borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
  py: BCDesignTokens.layoutPaddingXsmall,
  "&:first-of-type": {
    borderLeft: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));
