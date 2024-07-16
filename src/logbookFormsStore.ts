import { Authorization, LogbookWithAuth, Shift, Tag } from "./api";
import createAdminFormsStore from "./createAdminFormsStore";

/**
 * Shift that has not been uploaded to the server yet. `id`s starting with an
 * underscore are not uploaded yet.
 */
interface LocalShift extends Pick<Shift, "name" | "from" | "to"> {
  id: string | `_${string}`;
  name: string;
}

/**
 * Tag that may not have been updated to the server yet. If `id` is undefined,
 * then the tag has not been uploaded to the server
 */
interface LocalTag extends Pick<Tag, "name"> {
  id?: Tag["id"];
}

/**
 * Authorization that has not been uploaded to the server yet. If `id` is
 * undefined, then the authorization has not been uploaded to the server
 */
export type LocalAuthorization = Omit<Authorization, "id"> &
  Partial<Pick<Authorization, "id">>;

interface LogbookForm extends Pick<LogbookWithAuth, "id" | "name"> {
  tags: LocalTag[];
  shifts: LocalShift[];
  authorizations: LocalAuthorization[];
}

export const useLogbookFormsStore = createAdminFormsStore<LogbookForm>();
