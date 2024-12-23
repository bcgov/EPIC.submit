import React, { useState } from "react";
import { Checkbox, FormControlLabel, FormGroup } from "@mui/material";

type CheckboxGroupProps = {
  defaultSelectedValues?: unknown[];
  children: React.ReactNode;
  onChange: (selectedValues: unknown[]) => void;
  errorMessage?: string;
};
export const CheckboxGroup = ({
  onChange,
  defaultSelectedValues = [],
  children,
}: CheckboxGroupProps) => {
  const [selectedValues, setSelectedValues] = useState(defaultSelectedValues);

  const getFormControlLabels = () => {
    const childrenArray = React.Children.toArray(children);
    return childrenArray.filter(
      (child) => React.isValidElement(child) && child.type === FormControlLabel,
    );
  };
  return (
    <FormGroup>
      {getFormControlLabels().map((child) => {
        if (!React.isValidElement(child)) return null;
        const { value } = child.props.control.props;
        const isChecked = selectedValues.includes(value);
        return (
          <FormControlLabel
            key={`checkbox-${value}`}
            {...child.props}
            control={
              <Checkbox
                checked={isChecked}
                onChange={() => {
                  const newSelectedValues = isChecked
                    ? selectedValues.filter((v) => v !== value)
                    : [...selectedValues, value];
                  setSelectedValues(newSelectedValues);
                  onChange(newSelectedValues);
                }}
                {...child.props.control.props}
              />
            }
          />
        );
      })}
    </FormGroup>
  );
};
