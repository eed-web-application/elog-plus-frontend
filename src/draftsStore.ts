import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Attachment, Entry, EntryForm } from "./api";

export type LocalUploadedAttachment = Omit<Attachment, "previewState">;

export type Draft = Omit<EntryForm, "attachments"> & {
  attachments: LocalUploadedAttachment[];
};

interface DraftsState {
  newEntry: Draft;
  followUps: { [id: string]: Draft };
  supersedes: { [id: string]: Draft };
  getOrCreateFollowUpDraft: (entry: Entry) => Draft;
  getOrCreateSupersedingDraft: (entry: Entry) => Draft;
  updateNewEntryDraft: (draft: Draft) => void;
  updateFollowUpDraft: (entryId: string, draft: Draft) => void;
  updateSupersedingDraft: (entryId: string, draft: Draft) => void;
  removeNewEntryDraft: () => void;
  removeFollowUpDraft: (entryId: string) => void;
  removeSupersedingDraft: (entryId: string) => void;
}

const DEFAULT_DRAFT: Draft = {
  title: "",
  text: "",
  logbook: "",
  attachments: [],
  tags: [],
};

export const useDraftsStore = create(
  persist<DraftsState>(
    (set, get) => ({
      newEntry: {
        ...DEFAULT_DRAFT,
      },
      followUps: {},
      supersedes: {},
      getOrCreateFollowUpDraft(entry) {
        return (
          get().followUps[entry.id] || {
            ...DEFAULT_DRAFT,
            logbook: entry.logbook,
          }
        );
      },
      getOrCreateSupersedingDraft(entry) {
        return get().supersedes[entry.id] || { ...entry };
      },
      updateNewEntryDraft(draft) {
        set({ newEntry: draft });
      },
      updateFollowUpDraft(entryId, draft) {
        set((state) => ({
          followUps: { ...state.followUps, [entryId]: draft },
        }));
      },
      updateSupersedingDraft(entryId, draft) {
        set((state) => ({
          supersedes: { ...state.supersedes, [entryId]: draft },
        }));
      },
      removeNewEntryDraft() {
        set({ newEntry: { ...DEFAULT_DRAFT } });
      },
      removeFollowUpDraft(entryId) {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [entryId]: _removed, ...rest } = state.followUps;
          return { supersedes: rest };
        });
      },
      removeSupersedingDraft(entryId) {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [entryId]: _removed, ...rest } = state.supersedes;
          return { supersedes: rest };
        });
      },
    }),
    {
      name: "draft-store",
    }
  )
);
