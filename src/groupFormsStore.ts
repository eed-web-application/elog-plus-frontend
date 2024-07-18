import { GroupWithAuth } from "./api";
import createAdminFormsStore, {
  LocalAuthorization,
} from "./createAdminFormsStore";

export interface GroupForm extends Omit<GroupWithAuth, "authorizations"> {
  authorizations: LocalAuthorization[];
}

export const useGroupFormsStore = createAdminFormsStore<GroupForm>();
