import { create } from "zustand";
import { NewMPFormData } from "./types";

interface ManagementPlanFormState {
  formData: Partial<NewMPFormData>;
  setFormData: (formData: Partial<NewMPFormData>) => void;
  step: number;
  setStep: (step: number) => void;
  reset: () => void;
}

export const useManagementPlanForm = create<ManagementPlanFormState>((set) => ({
  formData: {},
  setFormData: (formData: Partial<NewMPFormData>) => set(() => ({ formData })),
  step: 0,
  setStep: (step: number) => set(() => ({ step })),
  reset: () => set(() => ({ formData: {}, step: 0 })),
}));
