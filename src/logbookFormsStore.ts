import { create } from "zustand";
import { Authorization, LogbookWithAuth, Shift, Tag } from "./api";

/**
 * Shift that has not been uploaded to the server yet. `id`s starting with an
 * underscore are not uploaded yet.
 */
interface LocalShift extends Pick<Shift, "name" | "from" | "to"> {
  id: string | `_${string}`;
  name: string;
}

/**
 * Tag that may not have been updated to the server yet. If `id` is undefined,
 * then the tag has not been uploaded to the server
 */
interface LocalTag extends Pick<Tag, "name"> {
  id?: Tag["id"];
}

/**
 * Authorization that has not been uploaded to the server yet. If `id` is
 * undefined, then the authorization has not been uploaded to the server
 */
export type LocalAuthorization = Omit<Authorization, "id"> &
  Partial<Pick<Authorization, "id">>;

interface LogbookForm extends Pick<LogbookWithAuth, "id" | "name"> {
  tags: LocalTag[];
  shifts: LocalShift[];
  authorizations: LocalAuthorization[];
}

interface LogbookFormsState {
  forms: Record<string, LogbookForm>;
  startEditing: (
    logbook: LogbookWithAuth,
  ) => [LogbookForm, (newValue: LogbookForm) => void, () => void];
  removeForm: (logbookId: string) => void;
  upsertForm: (newValue: LogbookForm) => void;
}

export const useLogbookFormsStore = create<LogbookFormsState>((set, get) => ({
  forms: {},
  startEditing(logbook) {
    const state = get();
    const form = state.forms[logbook.id] || logbook;

    return [
      form,
      (newValue: LogbookForm) => {
        if (JSON.stringify(newValue) === JSON.stringify(logbook)) {
          state.removeForm(logbook.id);
        } else {
          state.upsertForm(newValue);
        }
      },
      () => state.removeForm(logbook.id),
    ];
  },
  upsertForm(newValue: LogbookForm) {
    set(({ forms }) => ({
      forms: {
        ...forms,
        [newValue.id]: newValue,
      },
    }));
  },
  removeForm(logbookId: string) {
    set(({ forms }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [logbookId]: _removed, ...rest } = forms;

      return { forms: rest };
    });
  },
}));
