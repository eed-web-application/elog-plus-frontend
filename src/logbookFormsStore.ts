import { create } from "zustand";
import { Logbook, Shift, Tag } from "./api";

/**
 * Shift that has not been uploaded to the server yet. `id`s starting with an
 * underscore are not uploaded yet.
 */
interface LocalShift extends Omit<Partial<Shift>, "id"> {
  id: string | `_${string}`;
  name: string;
}

interface LogbookForm extends Omit<Logbook, "tags" | "shifts"> {
  tags: (Omit<Tag, "id"> & { id?: string })[];
  shifts: LocalShift[];
}

interface LogbookFormsState {
  forms: Record<string, LogbookForm>;
  startEditing: (
    logbook: Logbook
  ) => [LogbookForm, (newValue: LogbookForm) => void];
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
          set(({ forms }) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [logbook.id]: _removed, ...rest } = forms;

            return { forms: rest };
          });
        } else {
          state.upsertForm(newValue);
        }
      },
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
}));
