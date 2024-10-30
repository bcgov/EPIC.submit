import React, { useState } from "react";
import { CircularProgress, Link as MuiLink, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { PackageTableRow, StyledTableCell } from "./DocumentTableRow";

type DocumentTableRowProps = {
  documentItem: {
    id: number;
    name: string;
  };
  error?: boolean;
};
export default function PendingDocumentRow({
  documentItem,
  error = false,
}: DocumentTableRowProps) {
  const { name } = documentItem;

  const onActionClick = () => {};

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
            <MuiLink sx={{ textDecoration: "none" }}>{name}</MuiLink>
          </Typography>
        </StyledTableCell>
        <StyledTableCell align="center" colSpan={2}>
          <CircularProgress size={"16px"} />
        </StyledTableCell>
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
