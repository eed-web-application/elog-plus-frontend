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

function __createMockAuthorizations(user: User): UserWithAuth {
  return {
    ...user,
    authorizations: [
      {
        id: "1",
        permission: "Write",
        ownerId: user.id,
        ownerType: "User",
        ownerLabel: user.name,
        resourceId: "66958c2ee81b14088ef1228f",
        resourceType: "Logbook",
        resouceLabel: "ACCEL",
      },
      {
        id: "2",
        permission: "Read",
        ownerType: "User",
        ownerId: user.id,
        ownerLabel: user.name,
        resourceId: "66958c2ee81b14088ef12290",
        resourceType: "Logbook",
        resouceLabel: "PEP",
      },
    ],
  };
}

export async function fetchUser<A extends boolean | undefined>(
  id: string,
  includeAuthorizations: A,
): Promise<A extends true ? UserWithAuth : User> {
  // const user = (await fetch(`v1/auth/users/${id}`, {
  //   params: includeAuthorizations ? { includeAuthorizations: "true" } : {},
  // })) as any;

  // FIXME: Remove this when the proper API is implemented
  const adjustedUser = {
    id,
    name: "Name1 Surname1",
    email: "user1@slac.stanford.edu",
  };

  return includeAuthorizations
    ? __createMockAuthorizations(adjustedUser)
    : adjustedUser;
}

export type UserQuery<A extends boolean | undefined> = ResourceQuery & {
  includeAuthorizations?: A;
};

export async function fetchUsers<A extends boolean | undefined>(
  query: UserQuery<A>,
): Promise<(A extends true ? UserWithAuth : User)[]> {
  const params: ParamsObject = Object.assign(
    {
      includeAuthorizations: false,
    },
    query,
  );

  const users = (await fetch("v1/auth/users", {
    params: serializeParams(params),
  })) as any[];

  // FIXME: Remove this when the proper API is implemented
  return users.map((user) =>
    __createMockAuthorizations({
      id: user.uid,
      name: user.gecos,
      email: user.mail,
    }),
  );
}

export function fetchMe(): Promise<User> {
  return fetch("v1/auth/me");
}
