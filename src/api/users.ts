import { Authorization, ResourceQuery, fetch } from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserWithAuth extends User {
  authorizations: Authorization[];
}

export function updateUser(user: UserWithAuth) {
  return fetch(`v1/users/${user.id}`, {
    method: "PUT",
    body: user,
  });
}

export function fetchUser<A extends boolean | undefined>(
  id: string,
  includeAuthorizations: A,
): Promise<A extends true ? UserWithAuth : User> {
  return fetch(`v1/users/${encodeURI(id)}`, {
    params: includeAuthorizations ? { includeAuthorizations: "true" } : {},
  });
}

export type UserQuery<A extends boolean | undefined> = ResourceQuery & {
  includeAuthorizations?: A;
};

export function fetchUsers<A extends boolean | undefined>(
  query: UserQuery<A>,
): Promise<(A extends true ? UserWithAuth : User)[]> {
  const params: ParamsObject = Object.assign(
    {
      limit: 5,
      includeAuthorizations: false,
    },
    query,
  );

  return fetch("v1/users", {
    params: serializeParams(params),
  });
}

export function fetchMe(): Promise<User> {
  return fetch("v1/auth/me");
}
