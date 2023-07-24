import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Attachment, Entry, EntryForm } from "./api";

export type LocalUploadedAttachment = Omit<Attachment, "previewState">;

export type Draft = Omit<EntryForm, "attachments"> & {
  attachments: LocalUploadedAttachment[];
};

export type DraftId = "newEntry" | `supersede/${string}` | `followUp/${string}`;

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
