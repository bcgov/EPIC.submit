import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import { StatusEntry } from "@/models/Status";
import { FILTER_GROUPS } from "@/models/Submission";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ReactNode } from "react";
import { useProjectFilters } from "./projectFilterStore";

type StatusFilterProps<T extends string = string> = {
  label?: string;
  value?: T | T[];
  onChange?: (value: T | T[]) => void;
  multiple?: boolean;
  error?: boolean;
  onFocus?: () => void;
  availableStatuses?: T[];
  roleFilters: Record<string, StatusEntry<T>>;
  renderChip?: (value: T, label?: string) => ReactNode;
};

function StatusFilter<T extends string = string>({
  label = "Status",
  value: controlledValue,
  onChange,
  multiple = true,
  error,
  onFocus,
  availableStatuses,
  roleFilters,
  renderChip,
}: StatusFilterProps<T>) {
  const store = useProjectFilters();

  const chipRenderer =
    renderChip ??
    ((value: T, label?: string) => (
      <SubmissionStatusChip status={value} label={label} />
    ));

  const internalValue =
    controlledValue !== undefined
      ? controlledValue
      : (store.filters.status as unknown as T | T[]);

  const displayedStatuses = availableStatuses
    ? // Default to availableStatuses prop
      Object.values(roleFilters).filter((status) =>
        availableStatuses.includes(status.value),
      )
    : // Sort roleFilters and group them
      Object.values(roleFilters)
        .sort((a, b) => {
          if (a.sortOrder == null || b.sortOrder == null) return 0;
          return a.sortOrder - b.sortOrder;
        })
        .reduce((acc, status) => {
          const group = FILTER_GROUPS[status.value];
          if (group) {
            if (!acc.find((s) => s.label === group.label)) {
              acc.push({
                value: status.value,
                label: group.label,
              });
            }
          } else {
            acc.push(status);
          }
          return acc;
        }, [] as StatusEntry<T>[]);

  const handleChange = (event: SelectChangeEvent<T | T[]>) => {
    const value = event.target.value as T | T[];

    if (onChange) {
      onChange(value);
      return;
    }

    if (multiple && Array.isArray(value)) {
      if ((value as string[]).includes("all")) {
        store.setFilters({
          status: Object.values(roleFilters).map((status) => status.value),
        });
      } else if (value.length <= 3) {
        store.setFilters({ status: value as string[] });
      }
    } else if (!multiple && typeof value === "string") {
      store.setFilters({ status: value ? [value] : [] });
    }
  };

  const handleMenuItemClick = (statusValue: T) => {
    if (multiple) return; // MUI handles multi-select toggling via onChange

    let newValue: T | "" = statusValue;
    if (newValue === internalValue) {
      newValue = "";
    }

    if (onChange) {
      onChange(newValue as T);
    } else {
      store.setFilters({ status: newValue ? [newValue as string] : [] });
    }
  };

  return (
    <FormControl fullWidth error={error}>
      <Select
        labelId="status-select-label"
        id="status-select"
        placeholder={label}
        value={internalValue}
        multiple={multiple}
        displayEmpty
        onChange={handleChange}
        onFocus={onFocus}
        sx={{
          "& .MuiInputBase-input": {
            p: BCDesignTokens.layoutPaddingSmall,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault} !important`,
          },
        }}
        renderValue={(selected) => {
          if (!selected || (Array.isArray(selected) && selected.length === 0)) {
            return (
              <Typography
                variant="body2"
                color={BCDesignTokens.typographyColorDisabled}
                sx={{
                  lineHeight: BCDesignTokens.typographyLineHeightsXxdense,
                }}
              >
                {label}
              </Typography>
            );
          }

          if (Array.isArray(selected)) {
            return (
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {selected.map((value) => {
                  const display = displayedStatuses.find(
                    (d) => d.value === value,
                  );
                  return (
                    <Box key={value} mr={1}>
                      {chipRenderer(value as T, display?.label)}
                    </Box>
                  );
                })}
              </div>
            );
          }

          const display = displayedStatuses.find((d) => d.value === selected);
          return chipRenderer(selected as T, display?.label);
        }}
      >
        {displayedStatuses.map((status) => (
          <MenuItem
            key={status.value}
            value={status.value}
            onClick={() => handleMenuItemClick(status.value)}
          >
            {chipRenderer(status.value, status.label)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default StatusFilter;
