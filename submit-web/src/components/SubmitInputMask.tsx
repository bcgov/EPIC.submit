import { FC } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import InputMask, { Props as InputMaskProps } from "react-input-mask";

type IFormInputMaskProps = {
  inputProps?: TextFieldProps;
} & InputMaskProps;

const SubmitInputMask: FC<IFormInputMaskProps> = ({
  inputProps = {},
  ...inputMaskProps
}) => {
  return (
    <InputMask {...inputMaskProps}>
      <TextField {...inputProps} />
    </InputMask>
  );
};

export default SubmitInputMask;
