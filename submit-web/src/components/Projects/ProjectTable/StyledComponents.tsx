import { styled, TableCell, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const StyledProjectTableRow = styled(TableRow)(() => ({
  my: 1,
  "&:hover": {
    backgroundColor: BCDesignTokens.surfaceColorMenusHover,
  },
  padding: BCDesignTokens.layoutPaddingSmall,
  maxHeight: "40px",
  cursor: "pointer",
}));

export const StyledProjectTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
  borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
  "&:first-of-type": {
    borderLeft: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  padding: BCDesignTokens.layoutPaddingSmall,
  maxHeight: "40px",
  "&:last-of-type": {
    borderRight: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));
