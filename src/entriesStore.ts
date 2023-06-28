import { create } from "zustand";
import { Entry, fetchEntry } from "./api";

interface EntriesState {
  entries: { [id: string]: Entry };
  getOrFetch: (id: string) => Promise<Entry>;
  fetch: (id: string) => Promise<Entry>;
}

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: {},
  getOrFetch: async (id: string) => {
    const { entries, fetch } = get();

    if (entries[id]) {
      return entries[id];
    }
    const entry = await fetch(id);

    return entry;
  },
  fetch: async (id: string) => {
    const entry = await fetchEntry(id);
    set((state) => ({ ...state, entries: { ...state.entries, [id]: entry } }));
    return entry;
  },
}));
