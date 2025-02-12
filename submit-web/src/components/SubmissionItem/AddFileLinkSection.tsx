import { Stack } from "@mui/material";
import { useState } from "react";
import * as yup from "yup";
import { useFileStore } from "@/store/fileStore";
import { LoadingButton } from "../Shared/LoadingButton";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "../Shared/controlled/ControlledTextField";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { createInternalStaffDocument } from "@/hooks/api/useInternalStaffDocuments";
import { INTERNAL_STAFF_DOCUMENT_TYPE } from "@/models/SubmissionItem";

const addDocumentLinkSchema = yup.object().shape({
  link: yup.string().required("Link is required."),
  documentName: yup.string().required("Document name is required."),
});

export type AddDocumentLinkSchema = yup.InferType<typeof addDocumentLinkSchema>;

type AddFileLinkSectionProps = Readonly<{
  submissionItemId: number;
}>;
export default function AddFileLinkSection({
  submissionItemId,
}: AddFileLinkSectionProps) {
  const { addFile } = useFileStore();

  const [addingLink, setAddingLink] = useState(false);

  const methods = useForm({
    resolver: yupResolver(addDocumentLinkSchema),
    mode: "onSubmit",
  });

  const { handleSubmit, reset } = methods;

  const handleSaveLinkText = async (data: AddDocumentLinkSchema) => {
    const { link, documentName } = addDocumentLinkSchema.validateSync(data);
    try {
      const documentData = {
        name: documentName,
        url: link,
        type: INTERNAL_STAFF_DOCUMENT_TYPE.LINK,
      };
      const createdInternalStaff = await createInternalStaffDocument({
        submission_item_id: Number(submissionItemId),
        document: documentData,
      });
      addFile(createdInternalStaff);
      reset();
    } catch (error) {
      notify.error("Failed to save link");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleSaveLinkText)}>
        <Stack direction="row" spacing={2} alignItems="baseline">
          <ControlledTextField
            name="link"
            sx={{
              width: "500px",
            }}
            placeholder="Paste link here"
          />
          <ControlledTextField
            name="documentName"
            sx={{
              width: "230px",
            }}
            placeholder="Document name here"
          />
          <LoadingButton
            type="submit"
            variant="contained"
            color="secondary"
            loading={addingLink}
          >
            Save Link
          </LoadingButton>
        </Stack>
      </form>
    </FormProvider>
  );
}
