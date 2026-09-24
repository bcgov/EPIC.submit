import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LexicalEditor from "./LexicalEditor";

describe("LexicalEditor", () => {
  it("renders the placeholder text", () => {
    render(
      <LexicalEditor placeholder="Type your message" onChange={vi.fn()} />,
    );
    expect(screen.getByText("Type your message")).toBeInTheDocument();
  });

  it("renders the provided default HTML content", () => {
    render(
      <LexicalEditor
        placeholder="Placeholder"
        defaultHtml="<p>Existing banner text</p>"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Existing banner text")).toBeInTheDocument();
  });

  it("renders the label when provided", () => {
    render(
      <LexicalEditor
        placeholder="Placeholder"
        label="Banner content"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Banner content")).toBeInTheDocument();
  });

  it("shows the formatting toolbar when enabled", () => {
    render(<LexicalEditor placeholder="Placeholder" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bulleted List" }),
    ).toBeInTheDocument();
  });

  it("shows the link control in the toolbar", () => {
    render(<LexicalEditor placeholder="Placeholder" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
  });

  it("does not render a table control", () => {
    render(
      <LexicalEditor
        placeholder="Placeholder"
        isAdvanced
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Table" }),
    ).not.toBeInTheDocument();
  });

  it("hides the toolbar when disabled", () => {
    render(
      <LexicalEditor placeholder="Placeholder" disabled onChange={vi.fn()} />,
    );
    expect(
      screen.queryByRole("button", { name: "Bold" }),
    ).not.toBeInTheDocument();
  });
});
