import { styled } from "@mui/system";
import TableCell from "@mui/material/TableCell";
import { BCDesignTokens } from "epic.theme";
import {
  TableContainer,
  TableHead,
  TableRow,
  TableRowProps,
} from "@mui/material";
import React from "react";

export const SubmitTableHeadCell = styled(TableCell)(() => ({
  color: BCDesignTokens.themeGray70,
  fontSize: BCDesignTokens.typographyFontSizeSmallBody,
  fontWeight: BCDesignTokens.typographyFontWeightsBold,
  "&:hover": {
    color: BCDesignTokens.surfaceColorMenusHover,
  },
  border: "none",
  padding: BCDesignTokens.layoutPaddingXsmall,
  "&&:first-of-type": {
    paddingLeft: "1rem",
  },
  "&&:last-of-type": {
    paddingRight: "1rem",
  },
}));

export const SubmitCheckboxTableHeadCell = styled(SubmitTableHeadCell)(() => ({
  textAlign: "center",
}));

export const SubmitTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.themeBlue20}`,
  borderBottom: `1px solid ${BCDesignTokens.themeBlue20}`,
  padding: `${BCDesignTokens.layoutPaddingXsmall} !important`,
  "&:first-of-type": {
    borderLeft: `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));

export const SubmitTableRow = styled(TableRow)(() => ({
  height: "40px",
}));

export const PlainTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.themeGray40}`,
  borderBottom: `1px solid ${BCDesignTokens.themeGray40}`,
  padding: `${BCDesignTokens.layoutPaddingSmall} !important`,
  "&:first-of-type": {
    borderLeft: `1px solid ${BCDesignTokens.themeGray40}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: `1px solid ${BCDesignTokens.themeGray40}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));

export const PlainCheckboxTableCell = styled(PlainTableCell)(() => ({
  padding: 0,
  borderRight: `1px solid ${BCDesignTokens.themeGray40}`,
  textAlign: "center",
}));

export const SubmitTableHead = styled(TableHead)(() => ({}));

export const SubmitTableContainer = styled(TableContainer)(() => ({
  height: "100%",
  cursor: "pointer",
  overflow: "hidden",
}));

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error }) => ({
  height: "40px",
  backgroundColor: error
    ? BCDesignTokens.supportSurfaceColorDanger
    : BCDesignTokens.themeBlue10,
  "&:hover": {
    backgroundColor: BCDesignTokens.themeBlue40,
  },
}));
type StyledTableRowProps = TableRowProps & { error?: boolean };
export const SubmitTablePrimaryRow = ({
  error,
  children,
  ...otherProps
}: StyledTableRowProps) => {
  // pass error to every child
  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { error } as any)
      : child,
  );

  return (
    <StyledTableRow error={error} {...otherProps}>
      {childrenWithProps}
    </StyledTableRow>
  );
};

export const SubmitPrimaryRowTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error }) => ({
  borderTop: error
    ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
    : `1px solid ${BCDesignTokens.themeBlue20}`,
  borderBottom: error
    ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
    : `1px solid ${BCDesignTokens.themeBlue20}`,
  padding: `${BCDesignTokens.layoutPaddingXsmall} !important`,
  "&:first-of-type": {
    borderLeft: error
      ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
      : `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: error
      ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
      : `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));

export const SubmitSubTableCell = styled(TableCell)(() => ({
  borderTop: `none`,
  borderBottom: `none`,
  padding: `${BCDesignTokens.layoutPaddingXsmall}`,
}));
