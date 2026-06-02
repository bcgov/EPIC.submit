# StatusChip Component

A shared, configurable status chip component for displaying status badges across the application.

## Features

- **Consistent base styles**: 4px border radius, 24px height, 1px border, horizontal padding
- **Predefined themes**: 8 color themes (success, info, warning, danger, orange, purple, neutral, decision)
- **Custom colors**: Override with custom border and background colors
- **Icon support**: Optional icon display
- **Style overrides**: Use `sx` prop for custom styling

## Base Styles

All chips inherit these base styles:
```typescript
{
  borderRadius: "4px",
  height: "24px",
  px: 1,
  border: "1px solid [color]",
  "& .MuiChip-label": {
    overflow: "visible",
  },
}
```

## Usage Examples

### Using Predefined Themes

```tsx
import { StatusChip } from "@/components/Shared/StatusChip";

// Success theme (green)
<StatusChip label="Approved" theme="success" />

// Info theme (blue)
<StatusChip label="In Progress" theme="info" />

// Warning theme (yellow)
<StatusChip label="Pending" theme="warning" />

// Danger theme (red)
<StatusChip label="Rejected" theme="danger" />

// Orange theme
<StatusChip label="Update Requested" theme="orange" />

// Purple theme
<StatusChip label="Updated" theme="purple" />

// Neutral theme (gray)
<StatusChip label="Created" theme="neutral" />

// Decision theme
<StatusChip label="New" theme="decision" />
```

### Using Custom Colors

```tsx
<StatusChip 
  label="Custom Status"
  customColors={{
    border: "#123456",
    background: "#ABCDEF"
  }}
/>
```

### With Icons

```tsx
import CheckIcon from "@mui/icons-material/Check";

<StatusChip 
  label="Verified"
  theme="success"
  icon={<CheckIcon sx={{ fontSize: "16px" }} />}
/>
```

### With Style Overrides

```tsx
// Override width
<StatusChip 
  label="Fixed Width"
  theme="info"
  sx={{ width: "120px" }}
/>

// Override font size
<StatusChip 
  label="Custom Font"
  theme="success"
  sx={{ 
    fontSize: "14px",
    fontWeight: 600
  }}
/>
```

## Migration Guide

### Before (Old Pattern)

```tsx
// Old component-specific implementation
const statusStyles = {
  APPROVED: {
    sx: {
      borderRadius: "4px",
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
    },
    label: "Approved",
  },
};

<Chip sx={statusStyles.APPROVED.sx} label={statusStyles.APPROVED.label} />
```

### After (Using StatusChip)

```tsx
import { StatusChip } from "@/components/Shared/StatusChip";

<StatusChip label="Approved" theme="success" />
```

## Available Themes

| Theme | Border Color | Background Color | Use Case |
|-------|-------------|------------------|----------|
| `success` | Green | Light Green | Completed, Approved, Verified |
| `info` | Blue | Light Blue | In Progress, Submitted |
| `warning` | Yellow | Light Yellow | Pending, Review Not Completed |
| `danger` | Red | Light Red | Rejected, Failed |
| `orange` | Orange | Light Orange | Update Requested, Awaiting Approval |
| `purple` | Purple | Light Purple | Updated, New Version |
| `neutral` | Gray | Light Gray | Created, Default |
| `decision` | Decision Dark | Decision Light | New, Decision Required |

## Props API

```typescript
type StatusChipProps = {
  label: string;                    // Required: Text to display
  theme?: StatusChipTheme;          // Optional: Predefined theme
  customColors?: {                  // Optional: Custom colors
    border?: string;
    background?: string;
  };
  icon?: ReactNode;                 // Optional: Icon element
  sx?: SxProps<Theme>;             // Optional: Style overrides
  className?: string;               // Optional: CSS class name
};
```

## Migration Checklist

When migrating existing chip components:

1. ✅ Import `StatusChip` from `@/components/Shared/StatusChip`
2. ✅ Map existing colors to predefined themes (or use `customColors`)
3. ✅ Replace `<Chip>` with `<StatusChip>`
4. ✅ Use `theme` prop for standard colors
5. ✅ Use `customColors` for unique colors
6. ✅ Move any custom styles to `sx` prop
7. ✅ Test visual consistency
8. ✅ Remove old component-specific styling code
