import { UserWithAuth } from "./api";
import createAdminFormsStore, {
  LocalAuthorization,
} from "./createAdminFormsStore";

export interface UserForm extends Omit<UserWithAuth, "authorizations"> {
  authorizations: LocalAuthorization[];
}

export const useUserFormsStore = createAdminFormsStore<UserForm>();
