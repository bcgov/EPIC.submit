import React, { useEffect, useState } from "react";
import { InputAdornment, IconButton, TextField } from "@mui/material";
import { Search, Clear } from "@mui/icons-material";
import { useProjectFilters } from "./projectFilterStore";
import { BCDesignTokens } from "epic.theme";
import { USER_TYPE } from "@/models/User";

type SearchFilterProps = {
  userType?: string;
  placeholder?: string;
  value?: string;
  onApply?: (value: string) => void;
  error?: boolean;
  onFocus?: () => void;
};

export const SearchFilter = ({
    userType,
    placeholder: customPlaceholder,
    value: controlledValue,
    onApply,
    error,
    onFocus,
}: SearchFilterProps) => {
  const { filters, setFilters } = useProjectFilters();
  
  // Use controlled value if provided, synced via internal state for typing experience
  // but we should still allow typing to be smooth.
  const initialValue = controlledValue !== undefined ? controlledValue : filters.search_text;
  const [searchText, setSearchText] = useState(initialValue);

  // Sync internal state if controlled value changes externally
  useEffect(() => {
    if (controlledValue !== undefined) {
      setSearchText(controlledValue);
    }
  }, [controlledValue]);

  const triggerApply = (val: string) => {
    if (onApply) {
      onApply(val);
    } else {
      setFilters({ search_text: val });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      triggerApply(searchText);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleClear = () => {
    setSearchText("");
    triggerApply("");
  };

  const placeholderText = customPlaceholder || (userType === USER_TYPE.PROPONENT
    ? "Search Submissions" : "Search Projects/Submissions by Name");

  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder={placeholderText}
      value={searchText}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      error={error}
      InputProps={{
        startAdornment: (
          <InputAdornment
            position="start"
            sx={{ width: "auto", minWidth: "unset", mx: 0 }}
          >
            <Search htmlColor={BCDesignTokens.typographyColorPlaceholder} />
          </InputAdornment>
        ),
        endAdornment: searchText && (
          <InputAdornment position="end">
            <IconButton onClick={handleClear}>
              <Clear htmlColor={BCDesignTokens.typographyColorPlaceholder} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      inputProps={{
        sx: {
          "::placeholder": {
            fontSize: BCDesignTokens.typographyFontSizeSmallBody, // Controls placeholder font size
          },
        },
      }}
    />
  );
};
