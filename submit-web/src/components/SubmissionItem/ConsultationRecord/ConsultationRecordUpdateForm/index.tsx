import { Box } from "@mui/material";
import { ConsultationRecordFormContainer } from "../ConsultationRecordFormContainer";
import DocumentsTable from "./DocumentsTable";

export const ConsultationRecordUpdateForm = () => {
  return (
    <ConsultationRecordFormContainer>
      <Box>
        <DocumentsTable />
      </Box>
    </ConsultationRecordFormContainer>
  );
};
