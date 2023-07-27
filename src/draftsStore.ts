import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Attachment, Entry, EntryNew } from "./api";

/**
 * Attachment that has been uploaded to the server, but we don't have all its
 * properties (mostly because it was just uploaded).
 */
export type LocalUploadedAttachment = Omit<Attachment, "previewState">;

/**
 * An entry that hasn't been submitted to the server
 */
export type Draft = Omit<EntryNew, "attachments" | "eventAt"> & {
  /**
   * `null` meaning checked but no date
   */
  eventAt?: Date | null;
  attachments: LocalUploadedAttachment[];
};

export type DraftId = "newEntry" | `supersede/${string}` | `followUp/${string}`;

/**
 * Information needed to start a draft
 */
export type DraftFactory =
  | "newEntry"
  | ["followingUp", Entry]
  | ["superseding", Entry];

interface DraftsState {
  drafts: Partial<Record<DraftId, Draft>>;
  startDrafting: (
    factory: DraftFactory
  ) => [Draft, (draft: Draft) => void, () => void];
  upsertDraft: (draftId: DraftId, draft: Partial<Draft>) => void;
  removeDraft: (draftId: DraftId) => void;
}

export const DEFAULT_DRAFT: Draft = {
  title: "",
  text: "",
  logbook: "",
  attachments: [],
  tags: [],
};

/**
 * Manages and saves drafts (i.e., entries that haven't been submited to the
 * server yet).
 */
export const useDraftsStore = create(
  persist<DraftsState>(
    (set, get) => ({
      drafts: {},
      startDrafting(factory) {
        let draftId: DraftId;
        let defaultDraft: Draft;

        if (factory === "newEntry") {
          draftId = "newEntry";

          defaultDraft = DEFAULT_DRAFT;
        } else if (factory[0] === "superseding") {
          draftId = `supersede/${factory[1].id}`;

          defaultDraft = factory[1];
        } else {
          draftId = `followUp/${factory[1].id}`;

          defaultDraft = {
            ...DEFAULT_DRAFT,
            logbook: factory[1].logbook,
          };
        }

        const state = get();
        const draft = state.drafts[draftId] || defaultDraft;

        return [
          draft,
          (draft: Draft) => state.upsertDraft(draftId, draft),
          () => state.removeDraft(draftId),
        ];
      },
      upsertDraft(draftId, draft) {
        set(({ drafts }) => ({
          drafts: {
            ...drafts,
            [draftId]: { ...(drafts[draftId] || DEFAULT_DRAFT), ...draft },
          },
        }));
      },
      removeDraft(draftId) {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [draftId]: _removed, ...rest } = state.drafts;
          return { drafts: rest };
        });
      },
    }),
    {
      name: "draft-store",
    }
  )
);
