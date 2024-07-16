import { fetch } from ".";

export type Permission = "Read" | "Write" | "Admin";

export interface Authorization {
  id: string;
  permission: Permission;
  ownerId: string;
  ownerType: "User" | "Group" | "Application";
  ownerLabel: string;
  resourceId: string;
  resourceType: "Logbook";
  resouceLabel: string;
}

export function deleteAuthorization(id: string) {
  return fetch(`v1/authorizations/${id}`, { method: "DELETE" });
}

export type AuthorizationUpdation = Pick<Authorization, "permission">;

export function updateAuthorization(auth: Authorization) {
  return fetch(`v1/authorizations/${auth.id}`, {
    method: "PUT",
    body: auth,
  });
}

export type AuthorizationCreation = Omit<
  Authorization,
  "id" | "ownerLabel" | "resouceLabel"
>;

export function createAuthorization(auth: AuthorizationCreation) {
  return fetch(`v1/authorizations`, {
    method: "POST",
    body: auth,
  });
}
