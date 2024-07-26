import { Group } from "./api";
import createAdminFormsStore, {
  LocalAuthorization,
} from "./createAdminFormsStore";

export interface GroupForm extends Omit<Group<true, true>, "authorizations"> {
  authorizations: LocalAuthorization[];
}

export function validateGroupForm(form: GroupForm) {
  const invalid: Set<"name"> = new Set();

  if (!form.name) {
    invalid.add("name");
  }

  return invalid;
}

export const useGroupFormsStore = createAdminFormsStore<GroupForm>();
