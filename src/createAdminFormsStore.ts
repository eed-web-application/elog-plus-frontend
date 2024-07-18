import { create } from "zustand";
import { Authorization } from "./api";

/**
 * Authorization that has not been uploaded to the server yet. If `id` is
 * undefined, then the authorization has not been uploaded to the server
 */
export type LocalAuthorization = Omit<Authorization, "id"> &
  Partial<Pick<Authorization, "id">>;

export interface AdminResource {
  id: string;
}

export type AdminFormsState<T extends AdminResource> = {
  forms: Record<string, T>;
  startEditing: (startingForm: T) => {
    form: T;
    setForm: (newValue: T) => void;
    finishEditing: () => void;
  };
  removeForm: (id: string) => void;
  upsertForm: (newValue: T) => void;
};

export default function createAdminFormsStore<T extends AdminResource>() {
  return create<AdminFormsState<T>>((set, get) => ({
    forms: {},
    startEditing: (startingForm) => {
      const state = get();
      const form = state.forms[startingForm.id] || startingForm;

      return {
        form,
        setForm: (newValue) => {
          if (JSON.stringify(newValue) === JSON.stringify(startingForm)) {
            state.removeForm(startingForm.id);
          } else {
            state.upsertForm(newValue);
          }
        },
        finishEditing: () => state.removeForm(form.id),
      };
    },
    upsertForm(newValue: T) {
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
}
