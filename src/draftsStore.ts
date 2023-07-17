import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Attachment, EntryForm } from "./api";

export type LocalUploadedAttachment = Omit<Attachment, "previewState">;

export type Draft = Omit<EntryForm, "attachments"> & {
  attachments: LocalUploadedAttachment[];
};

interface DraftsState {
  newEntry: Draft;
  followUps: { [id: string]: Draft };
  supersedes: { [id: string]: Draft };
  updateNewEntryDraft: (draft: Draft) => void;
  updateFollowUpDraft: (entryId: string, draft: Draft) => void;
  updateSupersedingDraft: (entryId: string, draft: Draft) => void;
  removeNewEntryDraft: () => void;
  removeFollowUpDraft: (entryId: string) => void;
  removeSupersedingDraft: (entryId: string) => void;
}

export const DEFAULT_DRAFT: Draft = {
  title: "",
  text: "",
  logbook: "",
  attachments: [],
  tags: [],
};

export const useDraftsStore = create(
  persist<DraftsState>(
    (set) => ({
      newEntry: {
        ...DEFAULT_DRAFT,
      },
      followUps: {},
      supersedes: {},
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
          return { followUps: rest };
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
