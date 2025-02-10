import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { useGetAcitivityLogForAdmin } from "@/hooks/api/useActivtyLog";
import { AcitivityLog, ACTIVITY_LOG_ENTITY_TYPE } from "@/models/ActivityLog";
import dateUtils from "@/utils/dateUtils";
import {
  Box,
  TableBody,
  TableContainer,
  TableRow,
  Typography,
  Table,
  TableHead,
  styled,
  TableCell,
  Skeleton,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const HistoryTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.themeGray40}`,
  padding: "10px 0px 10px 0px",
  "&:first-of-type": {
    borderLeft: `none`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: `none`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));
const HistoryTableBody = ({
  activityLogs,
  loading,
}: {
  activityLogs?: AcitivityLog[];
  loading: boolean;
}) => {
  if (loading) {
    return (
      <>
        <TableRow>
          <HistoryTableCell colSpan={3} align="center">
            <Typography variant="body2">
              <Skeleton variant="text" />
            </Typography>
          </HistoryTableCell>
        </TableRow>
        <TableRow>
          <HistoryTableCell colSpan={3} align="center">
            <Typography variant="body2">
              <Skeleton variant="text" />
            </Typography>
          </HistoryTableCell>
        </TableRow>
      </>
    );
  }

  if (!activityLogs || activityLogs.length === 0) {
    return (
      <TableRow>
        <HistoryTableCell colSpan={3} align="center">
          <Typography variant="body2">No history available</Typography>
        </HistoryTableCell>
      </TableRow>
    );
  }

  return (
    <>
      {activityLogs.map((log) => (
        <TableRow key={log.id}>
          <HistoryTableCell>{log.action}</HistoryTableCell>
          <HistoryTableCell align="left">
            {dateUtils.formatDate(log.activity_at)}
          </HistoryTableCell>
          <HistoryTableCell align="right">
            {log.entity_version}
          </HistoryTableCell>
        </TableRow>
      ))}
    </>
  );
};

type HistoryTableProps = {
  packageId: string;
};

export const HistoryTable = ({ packageId }: HistoryTableProps) => {
  const { data: activityLogs, isPending: isLoading } =
    useGetAcitivityLogForAdmin({
      id: packageId,
      entityType: ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
    });

  return (
    <TableContainer
      component={Box}
      sx={{ height: "100%", marginBottom: "1em" }}
    >
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead
          sx={{
            ".MuiTableCell-root": {
              p: BCDesignTokens.layoutPaddingXsmall,
            },
          }}
        >
          <TableRow>
            <SubmitTableHeadCell>
              <Typography
                variant="body2"
                sx={{
                  border: "none",
                  color: BCDesignTokens.themeGray70,
                  "&:hover": {
                    color: "#EDEBE9",
                  },
                }}
              >
                Event
              </Typography>
            </SubmitTableHeadCell>
            <SubmitTableHeadCell>Date</SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Version</SubmitTableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <HistoryTableBody activityLogs={activityLogs} loading={isLoading} />
        </TableBody>
      </Table>
    </TableContainer>
  );
};
