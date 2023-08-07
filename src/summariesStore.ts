import { create } from "zustand";
import { fetchShiftSummary } from "./api";

/**
 * Simple cache for shift summaries IDs (not the summaries themselves).
 */
interface SummariesStore {
  summaries: Record<string, string>;
  getOrFetch(shiftId: string, date: string): Promise<string | undefined>;
  update(shiftId: string, date: string, summaryId: string): void;
}

export const useSummariesStore = create<SummariesStore>((set, get) => ({
  summaries: {},
  getOrFetch: async (shiftId: string, date: string) => {
    const ident = JSON.stringify([shiftId, date]);
    const state = get();

    if (ident in state.summaries) {
      return state.summaries[ident];
    }
    const summaryId = await fetchShiftSummary(shiftId, date);

    if (summaryId) {
      state.update(shiftId, date, summaryId);
    }
    return summaryId;
  },
  update: (shiftId: string, date: string, summaryId: string) => {
    set(({ summaries }) => {
      return {
        summaries: {
          ...summaries,
          [JSON.stringify([shiftId, date])]: summaryId,
        },
      };
    });
  },
}));
