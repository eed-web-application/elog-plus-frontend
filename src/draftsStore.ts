import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Attachment, EntryFull, EntryNew } from "./api";

/**
 * Attachment that has been uploaded to the server, but we don't have all its
 * properties (mostly because it was just uploaded).
 */
export type LocalUploadedAttachment = Pick<
  Attachment,
  "id" | "fileName" | "contentType"
>;

/**
 * A newly created tag that hasn't been submitted to the server
 */
export type NewTag = { name: string; logbook: string };

/**
 * An entry that hasn't been submitted to the server
 */
export type Draft = Omit<
  EntryNew,
  "attachments" | "eventAt" | "tags" | "summarizes"
> & {
  eventAt?: Date;
  attachments: LocalUploadedAttachment[];
  tags: (string | NewTag)[];
  summarizes: {
    checked: boolean;
  } & NonNullable<EntryNew["summarizes"]>;
};

export type DraftId = "newEntry" | `supersede/${string}` | `followUp/${string}`;

/**
 * Information needed to start a draft
 *
 * - `newEntry`: Start a new entry draft
 *   - `string[]`: Logbook IDs
 * - `followingUp`: Start a draft for following up an entry
 *   - `EntryFull`: Entry to follow up
 * - `superseding`: Start a draft for superseding an entry
 *   - `EntryFull`: Entry to supersede
 */
export type DraftFactory =
  | ["newEntry", string[]]
  | ["followingUp", EntryFull]
  | ["superseding", EntryFull];

interface DraftsState {
  drafts: Partial<Record<DraftId, Draft>>;
  startDrafting: (
    factory: DraftFactory,
  ) => [Draft, (draft: Draft) => void, () => void];
  upsertDraft: (draftId: DraftId, draft: Partial<Draft>) => void;
  removeDraft: (draftId: DraftId) => void;
}

export const DEFAULT_DRAFT: Draft = {
  title: "",
  text: "",
  logbooks: [],
  attachments: [],
  tags: [],
  summarizes: {
    checked: false,
    date: "",
    shiftId: "",
  },
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

        if (factory[0] === "newEntry") {
          draftId = "newEntry";

          defaultDraft = { ...DEFAULT_DRAFT, logbooks: factory[1] };
        } else if (factory[0] === "superseding") {
          draftId = `supersede/${factory[1].id}`;

          defaultDraft = {
            ...factory[1],
            summarizes: { ...DEFAULT_DRAFT.summarizes },
            logbooks: factory[1].logbooks.map(({ id }) => id),
            tags: factory[1].tags.map(({ id }) => id),
          };

          // If eventAt is the same as loggedAt, then we consider
          // it as there being no explicit event time and and thus we ensure
          // eventAt is undefined or deleted
          if (factory[1].eventAt.getTime() === factory[1].loggedAt.getTime()) {
            defaultDraft = { ...defaultDraft, eventAt: undefined };
          }
        } else {
          draftId = `followUp/${factory[1].id}`;

          defaultDraft = {
            ...DEFAULT_DRAFT,
            logbooks: factory[1].logbooks.map(({ id }) => id),
            tags: factory[1].tags.map(({ id }) => id),
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
      version: 0,
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (key !== "drafts") {
            return value;
          }

          for (const draft of Object.values(
            value as Record<
              string,
              Omit<Draft, "eventAt"> & {
                eventAt?: string | null | Date;
              }
            >,
          )) {
            draft.eventAt = draft.eventAt
              ? new Date(draft.eventAt)
              : draft.eventAt;
          }

          return value;
        },
      }),
    },
  ),
);
