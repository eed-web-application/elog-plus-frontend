import { ApplicationWithAuth } from "./api";
import createAdminFormsStore, {
  LocalAuthorization,
} from "./createAdminFormsStore";

export interface ApplicationForm
  extends Omit<ApplicationWithAuth, "authorizations"> {
  authorizations: LocalAuthorization[];
}

export const useApplicationFormsStore =
  createAdminFormsStore<ApplicationForm>();
