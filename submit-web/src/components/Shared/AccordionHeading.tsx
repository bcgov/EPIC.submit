import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Box } from "@mui/material";

declare module "@mui/material/Accordion" {
  interface AccordionHeadingSlotPropsOverrides {
    actions?: ReactNode;
  }
}

type HeadingProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode;
  ownerState?: unknown;
};

// Keep header actions beside the disclosure button, outside its heading and focus target.
export const AccordionHeading = forwardRef<HTMLDivElement, HeadingProps>(
  function AccordionHeading({ actions, children, ownerState, ...props }, ref) {
    void ownerState;
    return (
      <Box {...props} ref={ref} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Box component="h3" sx={{ m: 0, flex: "1 1 0", minWidth: 0 }}>
          {children}
        </Box>
        {actions && <Box sx={{ pr: 1.5 }}>{actions}</Box>}
      </Box>
    );
  },
);
