import { SubmitRadio } from "./SubmitRadio";

export const YES = true;
export const NO = false;

type IYesNoRadioOptionsProps = {
  error: boolean;
  disabled?: boolean;
};
export const YesNoRadioOptions = ({
  error = true,
  disabled = false,
}: IYesNoRadioOptionsProps) => {
  return (
    <>
      <SubmitRadio value={YES} label="Yes" error={error} disabled={disabled} />
      <SubmitRadio value={NO} label="No" error={error} disabled={disabled} />
    </>
  );
};
