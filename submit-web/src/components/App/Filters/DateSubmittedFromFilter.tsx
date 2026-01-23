import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useProjectFilters } from "./projectFilterStore";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { BCDesignTokens } from "epic.theme";

export default function DateSubmittedFromFilter() {
  const { filters, setFilters } = useProjectFilters();

  const handleDateChange = (date: Dayjs | null) => {
    const formattedDate = date ? date.format("YYYY-MM-DD") : "";
    setFilters({ submitted_on_start: formattedDate });
  };

  const date = filters.submitted_on_start
    ? dayjs(filters.submitted_on_start)
    : null;

  const maxDate = filters.submitted_on_end
    ? dayjs(filters.submitted_on_end)
    : undefined;

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
