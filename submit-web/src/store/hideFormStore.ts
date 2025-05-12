import { create } from "zustand";

type FormVisibilityState = {
  hiddenForms: Record<string, boolean>; // key format: `${submissionId}-${formType}`
  setFormVisibility: (submissionId: number, isHidden: boolean) => void;
  getFormVisibility: (submissionId: number) => boolean;
  resetFormVisibility: (submissionId: number) => void;
};

export const useFormVisibilityStore = create<FormVisibilityState>(
  (set, get) => ({
    hiddenForms: {},

    setFormVisibility: (submissionId: number, isHidden: boolean) => {
      set((state) => ({
        hiddenForms: {
          ...state.hiddenForms,
          [`${submissionId}`]: isHidden,
        },
      }));
    },

    getFormVisibility: (submissionId: number) => {
      return get().hiddenForms[`${submissionId}`] || false;
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
  }),
);
