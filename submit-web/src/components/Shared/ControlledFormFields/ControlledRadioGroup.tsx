import React, { FC } from "react";
import {
  FormControl,
  FormHelperText,
  RadioGroup,
  RadioGroupProps,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { get } from "lodash";

type IFormInputProps = {
  name: string;
  hideError?: boolean;
} & RadioGroupProps;

const ControlledRadioGroup: FC<IFormInputProps> = ({
  name,
  hideError = false,
  children,
  ...otherProps
}) => {
  const {
    control,
    formState: { defaultValues, errors },
  } = useFormContext();

  const error = get(errors, name);
  // pass error prop to children
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { error: Boolean(error) } as any);
    }
    return child;
  });

  return (
    <FormControl error={Boolean(error)} data-form-field={name}>
      <Controller
        control={control}
        name={name}
        defaultValue={get(defaultValues, name) ?? ""}
        render={({ field }) => {
          return (
            <RadioGroup {...otherProps} {...field} ref={(element) => field.ref(element instanceof HTMLElement ? element.querySelector("input:checked:not(:disabled)") ?? element.querySelector("input:not(:disabled)") : null)}>
              {childrenWithProps}
            </RadioGroup>
          );
        }}
      />
      {error && !hideError && (
        <FormHelperText>{error.message?.toString()}</FormHelperText>
      )}
    </FormControl>
  );
};

export default ControlledRadioGroup;
