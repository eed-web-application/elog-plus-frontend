import { create } from 'zustand';
import { UserAuthorization } from './api';


interface UserForm {
  mail: string;
  authorizations: UserAuthorization[];
}

interface UserFormsState {
  forms: Record<string, UserForm>;
  startEditing: (
    mail: string
  ) => [UserForm, (newValue: UserForm) => void, () => void];
  removeForm: (mail: string) => void; 
  upsertForm: (newValue: UserForm) => void; 
}

export const useUserFormsStore = create<UserFormsState>((set, get) => ({
  forms: {},
  startEditing(mail) {
    const state = get();
    const form = state.forms[mail] || { mail, authorizations: [] };

    return [
      form,
      (newValue: UserForm) => {
        if (JSON.stringify(newValue) === JSON.stringify(state.forms[mail])) {
          state.removeForm(mail);
        } else {
          state.upsertForm(newValue);
        }
      },
      () => state.removeForm(mail),
    ];
  },
  upsertForm(newValue) {
    set(({ forms }) => ({
      forms: {
        ...forms,
        [newValue.mail]: newValue,
      },
    }));
  },
  removeForm(mail) {
    set(({ forms }) => {
      const { [mail]: removed, ...rest } = forms; 

      return { forms: rest };
    });
  },
}));
