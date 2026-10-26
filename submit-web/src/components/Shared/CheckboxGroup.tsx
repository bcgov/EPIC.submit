import React, { useState } from "react";
import { Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { isArray, isNil } from "lodash";
import { BCDesignTokens } from "epic.theme";

export type CheckboxGroupProps = {
  defaultSelectedValues?: unknown[];
  children: React.ReactNode;
  onChange?: (selectedValues: unknown[]) => void;
  errorMessage?: string;
  disabled?: boolean;
  value?: unknown[];
  controlled?: boolean;
  error?: boolean;
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
};
export const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(function CheckboxGroup({
  onChange = () => {},
  disabled,
  value: values,
  children,
  defaultSelectedValues = [],
  controlled = false,
  error = false,
  onBlur,
}, ref) {
  const [selectedValues, setSelectedValues] = useState(defaultSelectedValues);

  const getFormControlLabels = () => {
    const childrenArray = React.Children.toArray(children);
    return childrenArray.filter(
      (child) => React.isValidElement(child) && child.type === FormControlLabel,
    );
  };

  const currentValues =
    controlled && !isNil(values) && isArray(values) ? values : selectedValues;
  return (
    <FormGroup ref={ref} onBlur={onBlur}>
      {getFormControlLabels().map((child) => {
        if (!React.isValidElement(child)) return null;
        const { sx: childSx = {}, ...otherProps } = child.props;
        const {
          value,
          sx: controlSx = {},
          ...otherControlProps
        } = child.props.control.props;

        const isChecked = currentValues.includes(value);

        return (
          <FormControlLabel
            key={`checkbox-${value}`}
            sx={{
              "& .MuiFormControlLabel-label": {
                color: error ? BCDesignTokens.iconsColorDanger : "inherit",
              },
              ...childSx,
            }}
            {...otherProps}
            control={
              <Checkbox
                disabled={disabled}
                checked={isChecked}
                onChange={() => {
                  const newSelectedValues = isChecked
                    ? currentValues.filter((v) => v !== value)
                    : [...currentValues, value];
                  if (!controlled) {
                    setSelectedValues(newSelectedValues);
                  }
                  onChange(newSelectedValues);
                }}
                sx={{
                  color: error ? BCDesignTokens.iconsColorDanger : "inherit",
                  ...controlSx,
                }}
                {...otherControlProps}
              />
            }
          />
        );
      })}
    </FormGroup>
  );
});
