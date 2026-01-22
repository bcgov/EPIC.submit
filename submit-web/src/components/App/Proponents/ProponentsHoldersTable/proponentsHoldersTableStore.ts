import { create } from "zustand";

type SortOrder = "asc" | "desc";

interface ProponentsHoldersTableStoreState {
  searchText: string;
  setSearchText: (searchText: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (sortOrder: SortOrder) => void;
  toggleSortOrder: () => void;
  statusFilters: string[];
  setStatusFilters: (statusFilters: string[]) => void;
  resetFilters: () => void;
}

export const useProponentsHoldersTable = create<ProponentsHoldersTableStoreState>((set) => ({
  searchText: "",
  setSearchText: (searchText: string) => set({ searchText }),
  sortOrder: "asc",
  setSortOrder: (sortOrder: SortOrder) => set({ sortOrder }),
  toggleSortOrder: () => set((state) => ({ sortOrder: state.sortOrder === "asc" ? "desc" : "asc" })),
  statusFilters: [],
  setStatusFilters: (statusFilters: string[]) => set({ statusFilters }),
  resetFilters: () => set({ searchText: "", statusFilters: [] }),
}));

