import { PaginatedDocumentsResponse } from "@/models/Submission";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import DocumentTableHead from "./DocumentTableHead";
import DocumentTableRow from "./DocumentTableRow";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

import { SubmitTableCell } from "@/components/Shared/Table/common";

type DocumentsParams = {
  data?: PaginatedDocumentsResponse;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
};
export const Documents = ({
  data,
  isLoading,
  onPageChange,
  onRowsPerPageChange,
}: DocumentsParams) => {
  const documents = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const size = data?.size ?? 10;

  if (isLoading) return <DocumentsSkeleton />;

  return (
    <Box>
      <TableContainer component={Box} sx={{ height: "100%" }}>
        <Table>
          <DocumentTableHead />
          <TableBody>
            {documents.length > 0 ? (
              documents.map((document) => (
                <DocumentTableRow
                  key={document.id}
                  submittedDocument={document}
                />
              ))
            ) : (
              <TableRow>
                <SubmitTableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 4 }}>
                    No documents matching those criteria
                  </Typography>
                </SubmitTableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={size}
          onRowsPerPageChange={(event) =>
            onRowsPerPageChange(parseInt(event.target.value, 10))
          }
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </Box>
  );
};

export const DocumentsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
