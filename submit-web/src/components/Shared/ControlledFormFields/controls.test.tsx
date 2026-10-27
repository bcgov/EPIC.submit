import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { Checkbox, FormControlLabel, ThemeProvider } from "@mui/material";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { theme } from "@/styles/theme";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import ControlledSelect from "./ControlledSelect";
import ControlledTextField from "./ControlledTextField";
import ControlledRadioGroup from "./ControlledRadioGroup";
import ControlledCheckboxGroup from "./ControlledCheckboxGroup";

type Values = { contact: string; phone: string; answer: boolean; notifications: string[]; project: string | number };
function renderControls(children: ReactNode) {
  let form: UseFormReturn<Values>;
  function Harness() {
    const methods = useForm<Values>({ defaultValues: { contact: "", phone: "", answer: false, notifications: [], project: 0 } });
    form = methods;
    // Subscribe so touched/dirty state can be observed after events.
    void methods.formState.touchedFields;
    return <ThemeProvider theme={theme}><FormProvider {...methods}>{children}</FormProvider></ThemeProvider>;
  }
  render(<Harness />);
  return () => form;
}

describe("shared field bindings", () => {
  it("preserves rich helper text until validation supplies an error", async () => {
    const form = renderControls(<ControlledTextField name="contact" label="Contact" helperText={<strong>Internal note only.</strong>} />);
    expect(screen.getByText("Internal note only.")).toBeInTheDocument();
    act(() => form().setError("contact", { type: "required", message: "Contact is required" }));
    expect(await screen.findByText("Contact is required")).toBeInTheDocument();
    expect(screen.queryByText("Internal note only.")).not.toBeInTheDocument();
    act(() => form().clearErrors("contact"));
    expect(await screen.findByText("Internal note only.")).toBeInTheDocument();
  });

  it("preserves caller slots and handlers while registering the transformed value", async () => {
    const onChange = vi.fn();
    const onSlotChange = vi.fn();
    const form = renderControls(<ControlledTextField name="contact" label="Contact" maxLength={30} inputEffects={(event) => event.target.value.toUpperCase()} onChange={onChange} slotProps={{ input: () => ({ onChange: onSlotChange }), htmlInput: () => ({ maxLength: 12, "data-testid": "contact-input" }) }} />);
    const input = screen.getByRole("textbox", { name: "Contact" });
    expect(input).toHaveAttribute("maxlength", "12");
    expect(input).toHaveAttribute("data-testid", "contact-input");
    fireEvent.change(input, { target: { value: "ada" } });
    await waitFor(() => expect(form().getValues("contact")).toBe("ADA"));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onSlotChange).toHaveBeenCalledOnce();
    act(() => form().setFocus("contact"));
    expect(input).toHaveFocus();
  });


  it("composes select slot handlers without losing the registered value", async () => {
    const onChange = vi.fn();
    const onSlotChange = vi.fn();
    const form = renderControls(<ControlledSelect name="project" label="Project" options={[{ value: 0, label: "Zero" }, { value: 1, label: "One" }]} onChange={onChange} slotProps={{ select: () => ({ onChange: onSlotChange }) }} />);
    await userEvent.click(screen.getByRole("combobox", { name: "Project" }));
    await userEvent.click(screen.getByRole("option", { name: "One" }));
    expect(form().getValues("project")).toBe(1);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onSlotChange).toHaveBeenCalledOnce();
  });

  it("registers the native masked input for focus and its formatted value", async () => {
    const form = renderControls(<ControlledTextField name="phone" label="Phone" mask="(000) 000-0000" />);
    act(() => form().setFocus("phone"));
    const input = screen.getByRole("textbox", { name: "Phone" });
    expect(input).toHaveFocus();
    await userEvent.type(input, "2505550123");
    expect(form().getValues("phone")).toBe("(250) 555-0123");
  });

  it("retains false-valued radio defaults and focuses the checked option", () => {
    const form = renderControls(<ControlledRadioGroup name="answer" aria-label="Answer"><SubmitRadio value={true} label="Yes" /><SubmitRadio value={false} label="No" /></ControlledRadioGroup>);
    const no = screen.getByRole("radio", { name: "No" });
    expect(no).toBeChecked();
    act(() => form().setFocus("answer"));
    expect(no).toHaveFocus();
  });

  it("registers checkbox group focus, values and blur", async () => {
    const form = renderControls(<ControlledCheckboxGroup name="notifications"><FormControlLabel control={<Checkbox value="email" />} label="Email" /><FormControlLabel control={<Checkbox value="sms" />} label="SMS" /></ControlledCheckboxGroup>);
    act(() => form().setFocus("notifications"));
    expect(screen.getByRole("checkbox", { name: "Email" })).toHaveFocus();
    await userEvent.click(screen.getByRole("checkbox", { name: "SMS" }));
    fireEvent.blur(screen.getByRole("checkbox", { name: "SMS" }));
    await waitFor(() => expect(form().formState.touchedFields.notifications).toBe(true));
    expect(form().getValues("notifications")).toEqual(["sms"]);
  });
});
