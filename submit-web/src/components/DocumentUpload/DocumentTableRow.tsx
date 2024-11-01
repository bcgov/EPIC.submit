import React, { useState } from "react";
import {
  Link as MuiLink,
  styled,
  TableCell,
  TableRow,
  TableRowProps,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { downloadObject } from "@/hooks/api/useObjectStorage";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { Submission } from "@/models/Submission";

export const StyledHeadTableCell = styled(TableCell)<{ error?: boolean }>(
  ({ error }) => ({
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
  })
);

export const DocumentHeadTableRow = styled(TableRow)<{ error?: boolean }>(
  ({ error }) => ({
    backgroundColor: error
      ? BCDesignTokens.supportSurfaceColorDanger
      : BCDesignTokens.themeBlue10,
    "&:hover": {
      backgroundColor: BCDesignTokens.themeBlue40,
    },
  })
);

export const DocumentTableCell = styled(TableCell)(() => ({
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

const StyledTableRow = styled(TableRow)(() => ({}));

type StyledTableRowProps = TableRowProps & { error?: boolean };
export const PackageTableRow = ({
  error,
  children,
  ...otherProps
}: StyledTableRowProps) => {
  // pass error to every child
  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { error } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      : child
  );

  return (
    <StyledTableRow error={error} {...otherProps}>
      {childrenWithProps}
    </StyledTableRow>
  );
};

type DocumentTableRowProps = {
  documentItem: Submission;
  error?: boolean;
};
export default function DocumentTableRow({
  documentItem,
  error = false,
}: DocumentTableRowProps) {
  const { account_user, version, submitted_document } = documentItem;

  const onActionClick = () => {};
  const [pendingGetObject, setPendingGetObject] = useState(false);

  const getObjectFromS3 = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      const response = await downloadObject({
        filename: submitted_document.name,
        s3sourceuri: submitted_document.url,
      });
      const linkUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = linkUrl;
      link.setAttribute("download", submitted_document.name);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      notify.error("Failed to download documentItem");
    } finally {
      setPendingGetObject(false);
    }
  };

  return (
    <PackageTableRow
      key={`row-${documentItem.submitted_document.name}`}
      error={error}
    >
      <DocumentTableCell colSpan={2}>
        <Typography
          variant="body1"
          color="inherit"
          sx={{
            overflow: "clip",
            textOverflow: "ellipsis",
            cursor: "pointer",
            mx: 0.5,
            textDecoration: "none",
          }}
        >
          <MuiLink onClick={getObjectFromS3} sx={{ textDecoration: "none" }}>
            {submitted_document.name}
          </MuiLink>
        </Typography>
      </DocumentTableCell>
      <DocumentTableCell align="right">
        {account_user.full_name}
      </DocumentTableCell>
      <DocumentTableCell align="right">{version}</DocumentTableCell>
      <DocumentTableCell align="center">
        <Typography
          variant="body2"
          sx={{
            color: BCDesignTokens.typographyColorLink,
            "&:hover": {
              cursor: "pointer",
              textDecoration: "underline",
            },
          }}
          onClick={onActionClick}
        >
          Remove
        </Typography>
      </DocumentTableCell>
    </PackageTableRow>
  );
}
