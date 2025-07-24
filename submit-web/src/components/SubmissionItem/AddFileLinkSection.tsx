import { Stack } from "@mui/material";
import { useState } from "react";
import * as yup from "yup";
import { LoadingButton } from "../Shared/LoadingButton";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "../Shared/controlled/ControlledTextField";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { INTERNAL_STAFF_DOCUMENT_TYPE } from "@/models/SubmissionItem";
import { useCreateInternalStaffDocument } from "@/hooks/api/useInternalStaffDocuments";

const addDocumentLinkSchema = yup.object().shape({
  link: yup.string().required("Link is required."),
  documentName: yup.string().required("Document name is required."),
});

export type AddDocumentLinkSchema = yup.InferType<typeof addDocumentLinkSchema>;

type AddFileLinkSectionProps = Readonly<{
  packageId: number;
}>;
export default function AddFileLinkSection({
  packageId,
}: AddFileLinkSectionProps) {
  const [addingLink, setAddingLink] = useState(false);

  const methods = useForm({
    resolver: yupResolver(addDocumentLinkSchema),
    mode: "onSubmit",
  });

  const { handleSubmit, reset } = methods;

  const { mutate: createInternalStaffDocument } =
    useCreateInternalStaffDocument({
      packageId,
    });
  const handleSaveLinkText = async (data: AddDocumentLinkSchema) => {
    const { link, documentName } = addDocumentLinkSchema.validateSync(data);
    try {
      setAddingLink(true);
      const documentData = {
        name: documentName,
        url: link,
        type: INTERNAL_STAFF_DOCUMENT_TYPE.LINK,
      };
      createInternalStaffDocument({
        package_id: Number(packageId),
        document: documentData,
      });
      reset();
      setAddingLink(false);
    } catch (error) {
      setAddingLink(false);
      notify.error("Failed to save link");
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        data-cy="add-link-section"
        onSubmit={handleSubmit(handleSaveLinkText)}
      >
        <Stack direction="row" spacing={2} alignItems="baseline">
          <ControlledTextField
            name="link"
            sx={{
              width: "50%",
            }}
            placeholder="Paste link here"
          />
          <ControlledTextField
            name="documentName"
            sx={{
              width: "40%",
            }}
            placeholder="Document name here"
          />
          <LoadingButton
            type="submit"
            variant="contained"
            color="secondary"
            loading={addingLink}
            sx={{
              width: "10%",
            }}
          >
            Save Link
          </LoadingButton>
        </Stack>
      </form>
    </FormProvider>
  );
}
