import {
  Box,
  Select,
  MenuItem,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25] as const;

function getVisiblePages(
  current: number,
  total: number,
): Array<number | "..."> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages = new Set<number>();
  
  // Always show first page
  pages.add(0);
  
  // Always show last page
  pages.add(total - 1);
  
  // Add current page and adjacent pages
  for (let p = Math.max(0, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const output: Array<number | "..."> = [];

  for (let i = 0; i < sorted.length; i++) {
    const pageNum = sorted[i];
    const prev = sorted[i - 1];
    
    // Only add ellipsis if there's a gap of more than 1 page
    if (i > 0 && prev !== undefined && pageNum - prev > 1) {
      output.push("...");
    }
    output.push(pageNum);
  }

  return output;
}

export type TablePaginationFooterProps = Readonly<{
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: readonly number[];
}>;

export function TablePaginationFooter({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
}: TablePaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
  const visiblePages = getVisiblePages(page, totalPages);

  const handlePrev = () => {
    if (page > 0) onPageChange(null, page - 1);
  };

  const handleNext = () => {
    if (page < totalPages - 1) onPageChange(null, page + 1);
  };

  const handleFirst = () => {
    onPageChange(null, 0);
  };

  const handleLast = () => {
    onPageChange(null, totalPages - 1);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        mt: 2,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {/* "Showing X of Y results" */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: "14px" }}
        >
          Showing
        </Typography>
        <Select
          size="small"
          variant="standard"
          value={rowsPerPage}
          onChange={(e) => {
            const value = typeof e.target.value === "string" 
              ? Number.parseInt(e.target.value, 10)
              : e.target.value;
            // Create a synthetic ChangeEvent for compatibility
            const syntheticEvent = {
              target: { value: String(value) },
            } as React.ChangeEvent<HTMLInputElement>;
            onRowsPerPageChange(syntheticEvent);
          }}
          sx={{
            height: 28,
            minWidth: 50,
            "& .MuiSelect-select": {
              py: 0.5,
              pr: 1.5,
              border: "none",
              "&:focus": {
                backgroundColor: "transparent",
              },
            },
            "&::before": {
              borderBottom: "none",
            },
            "&::after": {
              borderBottom: "none",
            },
            "&:hover:not(.Mui-disabled)::before": {
              borderBottom: "none",
            },
            "&:hover": {
              "&::before": {
                borderBottom: "none",
              },
            },
          }}
        >
          {rowsPerPageOptions.map((opt) => (
            <MenuItem key={opt} value={opt} sx={{ fontSize: "14px" }}>
              {opt}
            </MenuItem>
          ))}
        </Select>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: "14px" }}
        >
          of {count} results
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box
          component="button"
          onClick={handleFirst}
          disabled={page === 0}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "none",
            p: 0.5,
            cursor: page === 0 ? "default" : "pointer",
            opacity: page === 0 ? 0.5 : 1,
            "&:hover": {
              opacity: page === 0 ? 0.5 : 0.8,
            },
          }}
        >
          <KeyboardDoubleArrowLeftIcon
            sx={{
              fontSize: "16px",
              width: "16px",
              height: "15px",
              color: "#9F9D9C",
            }}
          />
        </Box>

        <MuiLink
          component="button"
          onClick={handlePrev}
          sx={{
            textDecoration: "none",
            color: page === 0 ? "text.disabled" : "primary.main",
            cursor: page === 0 ? "default" : "pointer",
            fontSize: "14px",
            border: "none",
            background: "none",
            px: 1,
            "&:hover": {
              textDecoration: page === 0 ? "none" : "underline",
            },
          }}
        >
          Previous
        </MuiLink>

        {visiblePages.map((p, index) => {
          if (p === "...") {
            // Use a stable key based on the previous page number
            const prevPage = index > 0 && typeof visiblePages[index - 1] === "number"
              ? visiblePages[index - 1] as number
              : -1;
            return (
              <Typography
                key={`ellipsis-after-${prevPage}`}
                variant="body2"
                color="text.secondary"
                sx={{ px: 0.5, fontSize: "14px" }}
              >
                ...
              </Typography>
            );
          }
          return (
            <Box
              key={`page-${p}`}
              component="button"
              onClick={() => onPageChange(null, p)}
              sx={{
                minWidth: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                border: "none",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: p === page ? "primary.main" : "transparent",
                color: p === page ? "white" : "primary.main",
                "&:hover": {
                  backgroundColor: p === page ? "primary.dark" : "action.hover",
                },
              }}
            >
              {p + 1}
            </Box>
          );
        })}

        <MuiLink
          component="button"
          onClick={handleNext}
          sx={{
            textDecoration: "none",
            color: page >= totalPages - 1 ? "text.disabled" : "primary.main",
            cursor: page >= totalPages - 1 ? "default" : "pointer",
            fontSize: "14px",
            border: "none",
            background: "none",
            px: 1,
            "&:hover": {
              textDecoration: page >= totalPages - 1 ? "none" : "underline",
            },
          }}
        >
          Next
        </MuiLink>

        <Box
          component="button"
          onClick={handleLast}
          disabled={page >= totalPages - 1}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "none",
            p: 0.5,
            cursor: page >= totalPages - 1 ? "default" : "pointer",
            opacity: page >= totalPages - 1 ? 0.5 : 1,
            "&:hover": {
              opacity: page >= totalPages - 1 ? 0.5 : 0.8,
            },
          }}
        >
          <KeyboardDoubleArrowRightIcon
            sx={{
              fontSize: "16px",
              width: "16px",
              height: "15px",
              color: "#9F9D9C",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

