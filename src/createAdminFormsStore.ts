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
  authorizations: LocalAuthorization[];
}

type AuthorizationPartial = Partial<Omit<Authorization, "id" | "permission">>;

export type AdminFormsState<T extends AdminResource> = {
  forms: Record<string, T>;
  startEditing: (startingForm: T) => {
    form: T;
    updated: boolean;
    setForm: (newValue: T) => void;
    finishEditing: () => void;
    createAuthorization: (authorization: AuthorizationPartial) => void;
    removeAuthorization: (authorization: AuthorizationPartial) => void;
    updateAuthorization: (
      authorization: AuthorizationPartial,
      permission: Authorization["permission"],
    ) => void;
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

      const setForm = (newValue: T) => {
        if (JSON.stringify(newValue) === JSON.stringify(startingForm)) {
          state.removeForm(startingForm.id);
        } else {
          state.upsertForm(newValue);
        }
      };

      return {
        form,
        updated: startingForm.id in state.forms,
        setForm,
        finishEditing: () => state.removeForm(form.id),
        createAuthorization: (authorization) => {
          // If the user deletes an authorization and then creates a new one with the
          // same owner, we want to keep the ID so we don't create a new one.
          const existingAuthorization = form.authorizations.find(
            (otherAuthorization) =>
              (
                Object.keys(authorization) as (keyof AuthorizationPartial)[]
              ).every((key) => otherAuthorization[key] === authorization[key]),
          );

          setForm({
            ...form,
            authorizations: [
              ...form.authorizations,
              {
                ...authorization,
                id: existingAuthorization?.id,
                permission: "Read",
              },
            ],
          });
        },
        removeAuthorization: (authorization) => {
          setForm({
            ...form,
            authorizations: form.authorizations.filter(
              (otherAuthorization) =>
                !(
                  Object.keys(authorization) as (keyof AuthorizationPartial)[]
                ).every(
                  (key) => otherAuthorization[key] === authorization[key],
                ),
            ),
          });
        },
        updateAuthorization: (authorization, permission) => {
          setForm({
            ...form,
            authorizations: form.authorizations.map((otherAuthorization) =>
              (
                Object.keys(authorization) as (keyof AuthorizationPartial)[]
              ).every((key) => otherAuthorization[key] === authorization[key])
                ? { ...otherAuthorization, permission }
                : otherAuthorization,
            ),
          });
        },
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
