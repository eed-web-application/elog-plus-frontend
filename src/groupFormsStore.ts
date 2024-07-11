import { create } from "zustand";

/**
 * Authorization for a group.
 */
interface GroupAuthorization {
  authorizationType: "Read" | "Write"; // Adjust as per your actual types
  owner: string;
}

/**
 * Group form state structure.
 */
interface GroupForm {
  id: string; // Assuming each group form has an ID
  name: string; // Group name or identifier
  authorizations: GroupAuthorization[]; // List of authorizations for the group
}

/**
 * State structure for group forms store.
 */
interface GroupFormsState {
  forms: Record<string, GroupForm>; // Dictionary to store group forms by ID
  startEditing: (
    group: GroupForm,
  ) => [GroupForm, (newValue: GroupForm) => void, () => void]; // Function to start editing a group form
  removeForm: (groupId: string) => void; // Function to remove a group form
  upsertForm: (newValue: GroupForm) => void; // Function to add or update a group form
}

/**
 * Initial state and actions for group forms store.
 */
export const useGroupFormsStore = create<GroupFormsState>((set, get) => ({
  forms: {}, // Initialize forms as an empty object

  startEditing(group) {
    const state = get();
    const form = state.forms[group.id] || group;

    return [
      form,
      (newValue: GroupForm) => {
        if (JSON.stringify(newValue) === JSON.stringify(group)) {
          state.removeForm(group.id);
        } else {
          state.upsertForm(newValue);
        }
      },
      () => state.removeForm(group.uid),
    ];
  },

  upsertForm(newValue) {
    set(({ forms }) => ({
      forms: {
        ...forms,
        [newValue.id]: newValue,
      },
    }));
  },

  removeForm(groupId) {
    set(({ forms }) => {
      const { [groupId]: removed, ...rest } = forms; // Remove the form with given groupId
      return { forms: rest };
    });
  },
}));
