import { create } from "zustand";

export interface AdminResource {
  id: string;
}

export type AdminFormsState<T extends AdminResource> = {
  forms: Record<string, T>;
  startEditing: (startingForm: T) => [T, (newValue: T) => void, () => void];
  removeForm: (id: string) => void;
  upsertForm: (newValue: T) => void;
};

export default function createAdminFormsStore<T extends AdminResource>() {
  return create<AdminFormsState<T>>((set, get) => ({
    forms: {},
    startEditing: (startingForm) => {
      const state = get();
      const form = state.forms[startingForm.id] || startingForm;

      return [
        form,
        (newValue) => {
          if (JSON.stringify(newValue) === JSON.stringify(form)) {
            state.removeForm(startingForm.id);
          } else {
            state.upsertForm(newValue);
          }
        },
        () => state.removeForm(form.id),
      ];
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
