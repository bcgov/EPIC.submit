// Body copy for the acknowledge confirmation. The phase is interpolated so the
// Regulated Party message reads naturally (e.g. "... for Construction ...").
export const acknowledgeDocumentMessage = (phase: string): string =>
  `The Regulated Party will receive an email confirming that the EAO has ` +
  `received its Compliance Self-Report for ${phase} and that it will be ` +
  `posted on EPIC.`;
