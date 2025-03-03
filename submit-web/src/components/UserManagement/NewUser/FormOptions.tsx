import { SubmitRadio } from "@/components/Shared/SubmitRadio";

type FormOptionsProps = {
  error: boolean;
  disabled?: boolean;
};
export const FormOptions = ({
  error = true,
  disabled = false,
}: FormOptionsProps) => {
  return (
    <>
      <SubmitRadio
        value={"Admin"}
        label="Project Administrator"
        error={error}
        disabled={disabled}
      />
      <SubmitRadio
        value={"Collaborator"}
        label="Collarborator -  All Submission"
        error={error}
        disabled={disabled}
      />
      <SubmitRadio
        value={"CollaboratorSpecific"}
        label="Collarborator -  Specific Submissions"
        error={error}
        disabled={disabled}
      />
    </>
  );
};
