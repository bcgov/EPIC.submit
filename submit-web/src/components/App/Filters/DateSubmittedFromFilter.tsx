import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useProjectFilters } from "./projectFilterStore";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { BCDesignTokens } from "epic.theme";

type DateSubmittedFromFilterProps = {
  value?: string;
  onChange?: (value: string) => void;
  maxDate?: string;
  error?: boolean;
  onFocus?: () => void;
};

export default function DateSubmittedFromFilter({
    value: controlledValue,
    onChange,
    maxDate: controlledMaxDate,
    error,
    onFocus,
}: DateSubmittedFromFilterProps) {
  const { filters, setFilters } = useProjectFilters();

  const handleDateChange = (date: Dayjs | null) => {
    const formattedDate = date ? date.format("YYYY-MM-DD") : "";
    if (onChange) {
      onChange(formattedDate);
    } else {
      setFilters({ submitted_on_start: formattedDate });
    }
  };

  const internalValue = controlledValue !== undefined ? controlledValue : filters.submitted_on_start;
  const date = internalValue ? dayjs(internalValue) : null;

  const internalMaxDate = controlledMaxDate !== undefined ? controlledMaxDate : filters.submitted_on_end;
  const maxDate = internalMaxDate ? dayjs(internalMaxDate) : undefined;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={date}
        onChange={handleDateChange}
        maxDate={maxDate}
        slots={{
          textField: (params) => (
            <TextField
              fullWidth
              {...params}
              onFocus={onFocus}
              error={error}
              placeholder="Date Submitted - From"
              inputProps={{
                ...params.inputProps,
                sx: {
                  "::placeholder": {
                    fontSize: BCDesignTokens.typographyFontSizeSmallBody, // Controls placeholder font size
                  },
                },
              }}
            />
          ),
          openPickerIcon: () => (
            <CalendarMonthIcon
              htmlColor={BCDesignTokens.typographyColorPlaceholder}
            />
          ),
        }}
      />
    </LocalizationProvider>
  );
}
