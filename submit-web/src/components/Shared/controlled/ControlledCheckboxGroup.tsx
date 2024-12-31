import { FC } from "react";
import { FormControl, FormHelperText } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { get } from "lodash";
import { CheckboxGroup, CheckboxGroupProps } from "../CheckboxGroup";

type IFormInputProps = {
  name: string;
} & CheckboxGroupProps;

const ControlledCheckboxGroup: FC<IFormInputProps> = ({
  name,
  children,
  ...otherProps
}) => {
  const {
    control,
    formState: { defaultValues, errors },
  } = useFormContext();

  const error = get(errors, name);

  return (
    <FormControl error={Boolean(error)}>
      <Controller
        control={control}
        name={name}
        defaultValue={defaultValues?.[name] || ""}
        render={({ field }) => {
          return (
            <CheckboxGroup
              {...otherProps}
              {...field}
              controlled
              error={Boolean(error)}
            >
              {children}
            </CheckboxGroup>
          );
        }}
      />
      {error && <FormHelperText>{error.message?.toString()}</FormHelperText>}
    </FormControl>
  );
};

export default ControlledCheckboxGroup;
