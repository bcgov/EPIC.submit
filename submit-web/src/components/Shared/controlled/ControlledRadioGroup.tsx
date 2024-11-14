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
} & RadioGroupProps;

const ControlledRadioGroup: FC<IFormInputProps> = ({
  name,
  children,
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
        render={({ field }) => (
          <RadioGroup {...otherProps} {...field}>
            {children}
          </RadioGroup>
        )}
      />
      {error && <FormHelperText>{error.message?.toString()}</FormHelperText>}
    </FormControl>
  );
};

export default ControlledRadioGroup;
