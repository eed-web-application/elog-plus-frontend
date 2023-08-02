import { create } from "zustand";
import { Entry, fetchEntry } from "./api";

/**
 * Simple cache for specifically full entries (i.e., not EntrySummary)
 */
interface EntriesState {
  entries: { [id: string]: Entry };
  getOrFetch: (id: string) => Promise<Entry>;
  fetch: (id: string) => Promise<Entry>;
  invalidate: (id: string) => void;
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
  invalidate: (id: string) => {
    set(({ entries }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = entries;

      return { entries: rest };
    });
  },
}));
