import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  EAO_SUBMISSION_ITEM_FILTERS,
  PROPONENT_SUBMISSION_ITEM_FILTERS,
  SubmissionItemStatus,
} from "@/models/Submission";
import { StatusEntry, FILTER_GROUPS } from "@/models/Status";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useProjectFilters } from "./projectFilterStore";

type StatusFilterProps = {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  error?: boolean;
  onFocus?: () => void;
  availableStatuses?: string[];
};

function StatusFilter({
  value: controlledValue,
  onChange,
  multiple = true,
  error,
  onFocus,
  availableStatuses,
}: StatusFilterProps) {
  const store = useProjectFilters();
  const { userType } = useAccount();
  const isProponent = userType === USER_TYPE.PROPONENT;

  const roleFilters = isProponent
    ? PROPONENT_SUBMISSION_ITEM_FILTERS
    : EAO_SUBMISSION_ITEM_FILTERS;

  const internalValue =
    controlledValue !== undefined ? controlledValue : store.filters.status;

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
                isGroup: true,
              });
            }
          } else {
            acc.push(status);
          }
          return acc;
        }, [] as StatusEntry<SubmissionItemStatus>[]);

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    const value = event.target.value;

    if (onChange) {
      onChange(value);
      return;
    }

    if (multiple && Array.isArray(value)) {
      if (value.includes("all")) {
        store.setFilters({
          status: Object.values(roleFilters).map((status) => status.value),
        });
      } else if (value.length <= 3) {
        store.setFilters({ status: value });
      }
    } else if (!multiple && typeof value === "string") {
      store.setFilters({ status: value ? [value] : [] });
    }
  };

  const handleMenuItemClick = (statusValue: string) => {
    if (multiple) return; // MUI handles multi-select toggling via onChange

    let newValue = statusValue;
    if (newValue === internalValue) {
      newValue = "";
    }

    if (onChange) {
      onChange(newValue);
    } else {
      store.setFilters({ status: newValue ? [newValue] : [] });
    }
  };

  return (
    <FormControl fullWidth error={error}>
      <Select
        labelId="status-select-label"
        id="status-select"
        placeholder="Status"
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
                Status
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
                      <SubmissionStatusChip
                        status={value}
                        label={display?.label}
                      />
                    </Box>
                  );
                })}
              </div>
            );
          }

          const display = displayedStatuses.find((d) => d.value === selected);
          return (
            <SubmissionStatusChip status={selected} label={display?.label} />
          );
        }}
      >
        {displayedStatuses.map((status) => (
          <MenuItem
            key={status.value}
            value={status.value}
            onClick={() => handleMenuItemClick(status.value)}
          >
            <SubmissionStatusChip status={status.value} label={status.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default StatusFilter;
