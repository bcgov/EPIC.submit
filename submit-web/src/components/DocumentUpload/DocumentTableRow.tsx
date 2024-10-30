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
import { useNavigate, useParams } from "@tanstack/react-router";
import { downloadObject } from "@/hooks/api/useObjectStorage";
import { notify } from "../Shared/Snackbar/snackbarStore";

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

export const StyledHeadTableRow = styled(TableRow)<{ error?: boolean }>(
  ({ error }) => ({
    backgroundColor: error
      ? BCDesignTokens.supportSurfaceColorDanger
      : BCDesignTokens.themeBlue10,
    "&:hover": {
      backgroundColor: BCDesignTokens.themeBlue40,
    },
  })
);

const StyledTableCell = styled(TableCell)(() => ({
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
const PackageTableRow = ({
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
  documentItem: {
    id: number;
    name: string;
    submitted_by: string;
    version: number;
    url: string;
  };
  error?: boolean;
};
export default function DocumentTableRow({
  documentItem,
  error = false,
}: DocumentTableRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/_authenticated/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId",
  });

  const { name, id, submitted_by, version, url } = documentItem;

  const onActionClick = () => {
    navigate({
      to: `/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  const getObjectFromS3 = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      const response = await downloadObject({
        filename: name,
        s3sourceuri: url,
      });
      const linkUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = linkUrl;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      notify.error("Failed to download documentItem");
    } finally {
      setPendingGetObject(false);
    }
  };

  return (
    <>
      <PackageTableRow key={`row-${documentItem.name}`} error={error}>
        <StyledTableCell colSpan={2}>
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
            <MuiLink onClick={getObjectFromS3}>{name}</MuiLink>
          </Typography>
        </StyledTableCell>
        <StyledTableCell align="right">{submitted_by}</StyledTableCell>
        <StyledTableCell align="right">{version}</StyledTableCell>
        <StyledTableCell align="center">
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
        </StyledTableCell>
      </PackageTableRow>
    </>
  );
}
