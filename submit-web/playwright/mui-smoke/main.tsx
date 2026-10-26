import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Box, Button, Checkbox, FormControlLabel, Grid, ThemeProvider, Typography } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TermsModal from "@/components/Shared/Modals/TermsModal";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs, { type Dayjs } from "dayjs";
import { theme } from "@/styles/theme";
import { PageGrid } from "@/components/Shared/PageGrid";
import Form from "@/components/Shared/Forms/common";
import ControlledTextField from "@/components/Shared/ControlledFormFields/ControlledTextField";
import ControlledSelect from "@/components/Shared/ControlledFormFields/ControlledSelect";
import ControlledMultiSelect from "@/components/Shared/ControlledFormFields/ControlledMultiSelect";
import ControlledDatePicker from "@/components/Shared/ControlledFormFields/ControlledDatePicker";
import ControlledRadioGroup from "@/components/Shared/ControlledFormFields/ControlledRadioGroup";
import ControlledCheckboxGroup from "@/components/Shared/ControlledFormFields/ControlledCheckboxGroup";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import DateSubmittedFromFilter from "@/components/App/Filters/DateSubmittedFromFilter";
import DateSubmittedToFilter from "@/components/App/Filters/DateSubmittedToFilter";
import { UpdateRequestAccordion } from "@/components/App/SubmissionItem/SectionUpdateRequestPanel/UpdateRequestAccordion";
import ActionSplitButton from "@/components/Shared/ActionSplitButton/ActionSplitButton";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import ModalProvider from "@/components/Shared/Modals/ModalProvider";
import { useModal } from "@/components/Shared/Modals/modalStore";

const schema = yup.object({
  notes: yup.string().defined().default(""),
  contact: yup.string().required("Enter a contact name"),
  phone: yup.string().required("Enter a phone number").length(14, "Enter a complete phone number"),
  project: yup.number().required("Choose a project"),
  projects: yup.array(yup.string().required()).min(1, "Choose a supporting project").required(),
  decisionDate: yup.mixed<Dayjs>().nullable().defined()
    .test("valid-date", "Enter a decision date", (value) => dayjs.isDayjs(value) && value.isValid())
    .test("date-range", "Choose a date in 2026", (value) => !value || !value.isValid() || value.year() === 2026),
  contactPreference: yup.string().required(),
  notifications: yup.array(yup.string().required()).required(),
});
type Values = yup.InferType<typeof schema>;

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
queryClient.setQueryData(["terms-of-service"], { version: 42, content: "<h2>Terms for UI testing</h2>" + "<p>Please read these synthetic terms before agreeing.</p>".repeat(50) });

export function SmokeApp() {
  const methods = useForm<Values>({
    resolver: yupResolver(schema),
    defaultValues: { notes: "", contact: "", phone: "", project: 0, projects: [], decisionDate: dayjs("2026-10-25"), contactPreference: "email", notifications: ["email"] },
  });
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-31");
  const [expanded, setExpanded] = useState(true);
  const [termsVersion, setTermsVersion] = useState<number | null>(null);
  const [decision, setDecision] = useState("Pending");
  const { setOpen } = useModal();

  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <Box component="main" sx={{ maxWidth: "1100px", mx: "auto", pb: 4 }}>
        <PageGrid>
          <Grid size={12}><Typography variant="h1">Submit component contracts</Typography></Grid>
          <Grid size={12}>
            <FormProvider {...methods}>
              <Form methods={methods} aria-label="Submission details" onSubmit={methods.handleSubmit((data) => setSubmitted({ ...data, decisionDate: data.decisionDate?.format("YYYY-MM-DD") ?? null }))}>
                <Typography variant="h2" sx={{ mb: 2 }}>Submission details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}><ControlledTextField name="contact" label="Contact name" maxLength={30} fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><ControlledTextField name="phone" label="Work phone" mask="(000) 000-0000" fullWidth /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><ControlledSelect name="project" label="Project" placeholder="Choose a project" fullWidth options={[{ value: 0, label: "Project Zero" }, { value: 1, label: "Project One" }]} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><ControlledMultiSelect name="projects" multiple selectAll options={[{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }]} TextFieldProps={{ label: "Supporting projects" }} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><ControlledDatePicker name="decisionDate" label="Decision date" minDate={dayjs("2026-01-01")} maxDate={dayjs("2026-12-31")} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><Button type="button" color="secondary" onClick={() => methods.setValue("decisionDate", null)}>Clear decision date</Button></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><ControlledRadioGroup name="contactPreference" aria-label="Contact preference"><SubmitRadio value="email" label="Email contact" /><SubmitRadio value="phone" label="Phone contact" /></ControlledRadioGroup></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><ControlledCheckboxGroup name="notifications"><FormControlLabel control={<Checkbox value="email" />} label="Email notifications" /><FormControlLabel control={<Checkbox value="sms" />} label="SMS notifications" /></ControlledCheckboxGroup></Grid>
                  <Grid size={12}><ControlledTextField name="notes" label="Review notes" multiline rows={3} fullWidth /></Grid>
                  <Grid size={12}><Button type="submit">Save submission</Button></Grid>
                </Grid>
              </Form>
            </FormProvider>
          </Grid>
          <Grid size={12}><Box component="output" aria-label="Submitted values" sx={{ display: "block", overflowWrap: "anywhere" }}>{submitted ? JSON.stringify(submitted) : "Not submitted"}</Box></Grid>
          <Grid size={12}><Box component="output" aria-label="Dirty fields" sx={{ overflowWrap: "anywhere" }}>{JSON.stringify(methods.formState.dirtyFields)}</Box></Grid>
          <Grid size={12}><Typography variant="h2">Submitted-date filters</Typography></Grid>
          <Grid size={{ xs: 12, md: 6 }}><DateSubmittedFromFilter value={from} onChange={setFrom} maxDate={to} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><DateSubmittedToFilter value={to} onChange={setTo} minDate={from} /></Grid>
          <Grid size={12}><output aria-label="Filter values">{JSON.stringify({ from, to })}</output></Grid>
          <Grid size={12}>
            <Typography variant="h2">Staff actions</Typography>
            <UpdateRequestAccordion itemTypeName="Management plan" expanded={expanded} onToggle={() => setExpanded(!expanded)} reason="Review the updated document." createdBy="UI test" createdDate="2026-10-25" headerRightContent={<ActionSplitButton primaryAction={{ label: "Accept update", onClick: () => setDecision("Update accepted") }} secondaryActions={[{ label: "Withdraw update", onClick: () => setDecision("Update withdrawn") }]} />}>
            </UpdateRequestAccordion>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mt: 2 }}>
            <Button onClick={() => setOpen(<ConfirmationModal title="Confirm review decision" description="Accept this synthetic review?" confirmText="Accept review" onConfirm={() => setDecision("Review accepted")} />)}>Review decision</Button>
            <Button onClick={() => setOpen(<TermsModal onAgreeConfirmed={setTermsVersion} />)}>Read terms</Button>
            <output aria-label="Terms version">{termsVersion ?? "Not agreed"}</output>
            <output aria-label="Decision">{decision}</output>
            </Box>
          </Grid>
        </PageGrid>
      </Box>
      <ModalProvider />
    </ThemeProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<SmokeApp />);
