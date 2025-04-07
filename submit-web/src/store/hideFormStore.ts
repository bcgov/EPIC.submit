import { create } from "zustand";

export enum FORM_TYPE {
  CONSULTATION_RECORD = "CONSULTATION_RECORD",
  MANAGEMENT_PLAN = "MANAGEMENT_PLAN",
  // Add other form types as needed
}

type FormVisibilityState = {
  hiddenForms: Record<string, boolean>; // key format: `${submissionId}-${formType}`
  setFormVisibility: (
    submissionId: number,
    formType: FORM_TYPE,
    isHidden: boolean
  ) => void;
  getFormVisibility: (submissionId: number, formType: FORM_TYPE) => boolean;
  resetFormVisibility: (submissionId: number) => void;
};

export const useFormVisibilityStore = create<FormVisibilityState>(
  (set, get) => ({
    hiddenForms: {},

    setFormVisibility: (
      submissionId: number,
      formType: FORM_TYPE,
      isHidden: boolean
    ) => {
      set((state) => ({
        hiddenForms: {
          ...state.hiddenForms,
          [`${submissionId}-${formType}`]: isHidden,
        },
      }));
    },

    getFormVisibility: (submissionId: number, formType: FORM_TYPE) => {
      return get().hiddenForms[`${submissionId}-${formType}`] || false;
    },

    resetFormVisibility: (submissionId: number) => {
      set((state) => {
        const newHiddenForms = { ...state.hiddenForms };
        // Remove all entries for this submissionId
        Object.keys(newHiddenForms).forEach((key) => {
          if (key.startsWith(`${submissionId}-`)) {
            delete newHiddenForms[key];
          }
        });
        return { hiddenForms: newHiddenForms };
      });
    },
  })
);
