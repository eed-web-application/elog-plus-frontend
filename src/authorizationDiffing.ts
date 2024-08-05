import {
  Authorization,
  ServerError,
  createAuthorization,
  deleteAuthorization,
  updateAuthorization,
} from "./api";
import { LocalAuthorization } from "./createAdminFormsStore";
import reportServerError from "./reportServerError";

export async function saveAuthorizations(
  original: Authorization[],
  updated: LocalAuthorization[],
) {
  return Promise.all(
    updated
      .map(async (authorization) => {
        try {
          if (!authorization.id) {
            return createAuthorization(authorization);
          }

          if (
            original.some(
              (otherAuthorization) =>
                otherAuthorization.id === authorization.id &&
                otherAuthorization.permission === authorization.permission,
            )
          ) {
            return;
          }

          return updateAuthorization(authorization as Authorization);
        } catch (e) {
          if (!(e instanceof ServerError)) {
            throw e;
          }

          reportServerError("Could not save authorization", e);
        }
      })
      .concat(
        original.map(async (authorization) => {
          if (
            updated.some(
              (localAuthorization) =>
                localAuthorization.id === authorization.id,
            )
          ) {
            return;
          }

          try {
            return deleteAuthorization(authorization.id);
          } catch (e) {
            if (!(e instanceof ServerError)) {
              throw e;
            }

            reportServerError("Could not delete authorization", e);
          }
        }),
      ),
  );
}
