import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/styles/theme";

// Render under the app theme so theme typography colors (body1/body2) apply.
export const renderWithTheme = (ui: ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

// jsdom does not resolve "inherit", so walk up to the first real color.
export const resolvedColor = (el: Element) => {
  let node: Element | null = el;
  while (node && getComputedStyle(node).color === "inherit") {
    node = node.parentElement;
  }
  return node ? getComputedStyle(node).color : "";
};
