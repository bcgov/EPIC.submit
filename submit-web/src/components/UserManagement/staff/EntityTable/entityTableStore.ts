import { create } from "zustand";

interface EntityTableStoreState {
  searchText: string;
  setSearchText: (searchText: string) => void;
}

export const useEntityTable = create<EntityTableStoreState>((set) => ({
  searchText: "",
  setSearchText: (searchText: string) => set({ searchText }),
}));
