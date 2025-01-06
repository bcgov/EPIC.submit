import React from "react";
import { styled, TableCell, TableRow, TableRowProps } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionItemTableRow as SubmissionItemTableRowType } from "../types";
import { Case, Switch } from "react-if";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import ProponentSubmissionItemTableRow from "./ProponentSubmissionItemTableRow";
import StaffSubmissionItemTableRow from "./StaffSubmissionItemTableRow";

export const SubmissionItemTableCell = styled(TableCell)<{ error?: boolean }>(
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
  }),
);

const StyledTableRow = styled(TableRow)<{ error?: boolean }>(({ error }) => ({
  backgroundColor: error
    ? BCDesignTokens.supportSurfaceColorDanger
    : BCDesignTokens.themeBlue10,
  "&:hover": {
    backgroundColor: BCDesignTokens.themeBlue40,
  },
}));

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
      : child,
  );

  return (
    <StyledTableRow error={error} {...otherProps}>
      {childrenWithProps}
    </StyledTableRow>
  );
};

export type SubmissionItemTableRowProps = Readonly<{
  item: SubmissionItemTableRowType;
  error?: boolean;
}>;

export default function SubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { userType } = useAccount();

  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentSubmissionItemTableRow item={item} error={error} />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffSubmissionItemTableRow item={item} error={error} />
      </Case>
    </Switch>
  );
}
