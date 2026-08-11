import React, { useState } from "react";
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { AccessHistoryEntry, useGetAccessHistory } from "@/hooks/api/useAccountUsers";
import { roleDetails, USER_MANAGEMENT_ROLE } from "@/models/Role";

interface AccessHistoryTableProps {
  accountUserId: number | null;
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "--";
  return isoDate.split("T")[0];
}

function getRoleLabel(roleName: string): string {
  const details = roleDetails[roleName as USER_MANAGEMENT_ROLE];
  return details?.label || roleName;
}

function hasExpandableContent(entry: AccessHistoryEntry): boolean {
  if (
    entry.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR &&
    entry.package_names &&
    entry.package_names.length > 0
  ) {
    return true;
  }
  if (entry.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN) {
    return true;
  }
  return false;
}

const tableHeaderSx = {
  color: "#858A8C",
  fontFamily: "BC Sans",
  fontSize: "14px",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "21px",
  border: "none",
};

const nameCellSx = {
  color: "#255A90",
  fontFamily: "BC Sans",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "27.008px",
};

const bodyCellSx = {
  border: "none",
  borderBottom: "1px solid #E0E0E0",
};

interface ExpandableRowProps {
  entry: AccessHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandableRow({ entry, isExpanded, onToggle }: ExpandableRowProps) {
  const expandable = hasExpandableContent(entry);

  return (
    <React.Fragment>
      <TableRow>
        <TableCell sx={{ ...bodyCellSx, ...nameCellSx }}>
          {entry.project_name}
        </TableCell>
        <TableCell sx={bodyCellSx}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography component="span" sx={{ fontSize: "14px" }}>
              {getRoleLabel(entry.role_name)}
            </Typography>
            {expandable && (
              <IconButton
                aria-label={isExpanded ? "collapse details" : "expand details"}
                size="small"
                onClick={onToggle}
                sx={{ p: 0.25 }}
              >
                {isExpanded ? (
                  <KeyboardArrowUpIcon fontSize="small" />
                ) : (
                  <KeyboardArrowDownIcon fontSize="small" />
                )}
              </IconButton>
            )}
          </Box>
        </TableCell>
        <TableCell sx={bodyCellSx}>{formatDate(entry.access_start)}</TableCell>
        <TableCell sx={bodyCellSx}>{formatDate(entry.access_end)}</TableCell>
      </TableRow>
      {expandable && isExpanded && (
        <TableRow>
          <TableCell colSpan={4} sx={{ border: "none", pl: 4, pb: 2, pt: 1 }}>
            {entry.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR && (
              <>
                <Typography
                  sx={{
                    color: "#2D2D2D",
                    fontFamily: "BC Sans",
                    fontSize: "16px",
                    fontWeight: 400,
                    lineHeight: "24px",
                    mb: 1,
                  }}
                >
                  Collaborator on the following submissions
                </Typography>
                <Table size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...tableHeaderSx, width: "50%" }}>
                        Submission
                      </TableCell>
                      <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>
                        From
                      </TableCell>
                      <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>
                        To
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entry.package_names.map((pkgName, idx) => (
                      <TableRow key={`${entry.id}-pkg-${idx}`}>
                        <TableCell sx={{ ...bodyCellSx, ...nameCellSx }}>
                          {pkgName}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          {formatDate(entry.access_start)}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          {formatDate(entry.access_end)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
            {entry.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN && (
              <>
                <Typography
                  sx={{
                    color: "#2D2D2D",
                    fontFamily: "BC Sans",
                    fontSize: "16px",
                    fontWeight: 400,
                    lineHeight: "24px",
                    mb: 1,
                  }}
                >
                  Project Administrator for the following project
                </Typography>
                <Table size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...tableHeaderSx, width: "50%" }}>
                        Project
                      </TableCell>
                      <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>
                        From
                      </TableCell>
                      <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>
                        To
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ ...bodyCellSx, ...nameCellSx }}>
                        {entry.project_name}
                      </TableCell>
                      <TableCell sx={bodyCellSx}>
                        {formatDate(entry.access_start)}
                      </TableCell>
                      <TableCell sx={bodyCellSx}>
                        {formatDate(entry.access_end)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            )}
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

export function AccessHistoryTable({ accountUserId }: AccessHistoryTableProps) {
  const { data: history, isPending } = useGetAccessHistory({ accountUserId });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (entryId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  if (isPending) {
    return (
      <Typography variant="body2" sx={{ mt: 2, mx: 2 }}>
        Loading access history...
      </Typography>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Typography variant="body2" sx={{ mt: 2, mx: 2 }}>
        No access history available.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: "32px", mx: 2, mb: 2 }}>
      <TableContainer>
        <Table
          size="small"
          sx={{
            tableLayout: "fixed",
            "& .MuiTableBody-root": { border: "1px solid #E0E0E0" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>Project</TableCell>
              <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>Access Level</TableCell>
              <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>From</TableCell>
              <TableCell sx={{ ...tableHeaderSx, width: "25%" }}>To</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry) => (
              <ExpandableRow
                key={entry.id}
                entry={entry}
                isExpanded={expandedRows.has(entry.id)}
                onToggle={() => toggleRow(entry.id)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AccessHistoryTable;
