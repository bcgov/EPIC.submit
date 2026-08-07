import { styled, TableCell, TableRow } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const StyledProjectTableRow = styled(TableRow)(() => ({
  "&:hover": {
    backgroundColor: BCDesignTokens.surfaceColorMenusHover,
  },
  // Minimum row height; padding is included, taller content (e.g. stacked
  // status chips) grows the row beyond this.
  height: "52px",
}));

export const StyledProjectTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
  borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
  "&:first-of-type": {
    borderLeft: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  // 8px vertical / 16px horizontal so a single-line row stays at the 52px
  // minimum instead of ballooning from stacked vertical padding.
  padding: `${BCDesignTokens.layoutPaddingSmall} ${BCDesignTokens.layoutPaddingMedium}`,
  "&:last-of-type": {
    borderRight: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  "&&:first-of-type": {
    paddingLeft: "1rem",
  },
  "&&:last-of-type": {
    paddingRight: "1rem",
  },
}));
