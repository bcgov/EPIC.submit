import { create } from "zustand";

interface PackageTableStoreState {
  isValidating: boolean;
  reset: () => void;
  setIsValidating: (_isValidating: boolean) => void;
}
const initialState: Partial<PackageTableStoreState> = {
  isValidating: false,
};
export const usePackageTableStore = create<PackageTableStoreState>((set) => ({
  isValidating: false,
  setIsValidating: (_isValidating: boolean) =>
    set({ isValidating: _isValidating }),
  reset: () => set(initialState),
}));
