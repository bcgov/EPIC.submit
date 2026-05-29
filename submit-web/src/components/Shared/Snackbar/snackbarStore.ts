import { create } from "zustand";

interface SnackbarState {
  isOpen: boolean;
  severity: "success" | "error" | "warning" | "info";
  message: string;
  autoHideDuration: number;
  setOpen: (
    message: string,
    severity?: "success" | "error" | "warning" | "info",
    autoHideDuration?: number,
  ) => void;
  setClose: () => void;
}

export const useSnackbar = create<SnackbarState>((set) => ({
  isOpen: false,
  severity: "success", // default severity
  message: "",
  autoHideDuration: 3000,
  setOpen: (message, severity = "success", autoHideDuration = 3000) =>
    set({ isOpen: true, message, severity, autoHideDuration }),
  setClose: () => set({ isOpen: false }),
}));

// Helper function to notify with different severities
export const notify = {
  success: (message: string, autoHideDuration?: number) =>
    useSnackbar.getState().setOpen(message, "success", autoHideDuration),
  error: (message: string, autoHideDuration?: number) => 
    useSnackbar.getState().setOpen(message, "error", autoHideDuration),
  warning: (message: string, autoHideDuration?: number) =>
    useSnackbar.getState().setOpen(message, "warning", autoHideDuration),
  info: (message: string, autoHideDuration?: number) => 
    useSnackbar.getState().setOpen(message, "info", autoHideDuration),
};
