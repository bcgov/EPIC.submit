import { FC } from "react";
import {
  FormControl,
  FormHelperText,
  RadioGroup,
  RadioGroupProps,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

type IFormInputProps = {
  name: string;
  disabled?: boolean;
} & RadioGroupProps;

const ControlledRadioGroup: FC<IFormInputProps> = ({
  name,
  children,
  disabled,
  ...otherProps
}) => {
  const {
    control,
    formState: { defaultValues, errors },
  } = useFormContext();

  const error = errors[name];
  return (
    <FormControl error={Boolean(error)}>
      <Controller
        control={control}
        name={name}
        defaultValue={defaultValues?.[name] || ""}
        disabled={disabled}
        render={({ field }) => (
          <RadioGroup disabled={disabled} {...otherProps} {...field}>
            {children}
          </RadioGroup>
        )}
      />
      {error && <FormHelperText>{error.message?.toString()}</FormHelperText>}
    </FormControl>
  );
};

export default ControlledRadioGroup;
