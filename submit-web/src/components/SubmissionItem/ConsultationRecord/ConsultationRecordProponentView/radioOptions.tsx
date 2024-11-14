import { RadioOptions } from "@/components/Shared/controlled/ControlledRadioGroup";

export const YesOrNoOptions: RadioOptions[] = [
  {
    label: "Yes",
    value: true,
  },
  {
    label: "No",
    value: false,
  },
];

export const YesNoNotApplicableOptions: RadioOptions[] = [
  {
    label: "Yes",
    value: false,
  },
  {
    label: "No",
    value: true,
  },
  {
    label: "Not Applicable",
    value: "",
  },
];
