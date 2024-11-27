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

  const error = get(errors, name);
  // pass error prop to children
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { error: Boolean(error) } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    return child;
  });

  return (
    <FormControl error={Boolean(error)}>
      <Controller
        control={control}
        name={name}
        defaultValue={defaultValues?.[name] || ""}
        render={({ field }) => {
          return (
            <RadioGroup {...otherProps} {...field}>
              {childrenWithProps}
            </RadioGroup>
          );
        }}
      />
      {error && <FormHelperText>{error.message?.toString()}</FormHelperText>}
    </FormControl>
  );
};

export default ControlledRadioGroup;
