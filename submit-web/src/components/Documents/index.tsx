import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmittedDocument } from "@/models/Submission";
import { Stack } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import DocumentTableHead from "./DocumentTableHead";
import DocumentTableRow from "./DocumentTableRow";
import { Navigate } from "@tanstack/react-router";
import { ContentBox } from "../Shared/ContentBox";

type DocumentsParams = {
  documents?: SubmittedDocument[];
};
export const Documents = ({ documents }: DocumentsParams) => {
  if (!documents) return <Navigate to={"/error"} />;
  return (
    <ContentBox
      mainLabel={"Documents"}
      label={""}
      contentBoxVariant="secondary"
    >
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        sx={{
          pt: BCDesignTokens.layoutPaddingMedium,
          pb: BCDesignTokens.layoutPaddingXlarge,
        }}
      >
        <TableContainer component={Box} sx={{ height: "100%" }}>
          <Table>
            <DocumentTableHead />
            <TableBody>
              {documents?.map((document) => (
                <DocumentTableRow
                  key={document.id}
                  submittedDocument={document}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </ContentBox>
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
