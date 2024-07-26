import { fetch, Authorization, ResourceQuery, User } from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export type Group<A extends boolean, M extends boolean> = {
  id: string;
  name: string;
  description: string;
} & (A extends true ? { authorizations: Authorization[] } : {}) &
  (M extends true ? { members: User[] } : {});

export type GroupOptions<A extends boolean, M extends boolean> = {
  includeAuthorizations?: A;
  includeMembers?: M;
};

export type GroupQuery<A extends boolean, M extends boolean> = ResourceQuery &
  GroupOptions<A, M>;

export function fetchGroup<A extends boolean, M extends boolean>(
  id: string,
  options?: GroupOptions<A, M>,
): Promise<Group<A, M>> {
  const params = Object.assign(
    {
      includeAuthorizations: false,
      includeMembers: false,
    },
    options,
  );

  return fetch(`v1/groups/${id}`, {
    params: serializeParams(params),
  });
}

export function fetchGroups<A extends boolean, M extends boolean>(
  query: GroupQuery<A, M>,
): Promise<Group<A, M>[]> {
  const params: ParamsObject = Object.assign(
    {
      includeAuthorizations: false,
      includeMembers: false,
    },
    query,
  );

  return fetch("v1/groups", { params: serializeParams(params) });
}

export type GroupNew = Pick<Group<false, false>, "name" | "description"> & {
  members: string[];
};

export function createGroup(group: GroupNew) {
  return fetch(`v1/groups`, {
    method: "POST",
    body: group,
  });
}

export type GroupUpdation = Pick<
  Group<false, false>,
  "id" | "name" | "description"
> & {
  members: string[];
};

export function updateGroup(group: GroupUpdation) {
  return fetch(`v1/groups/${group.id}`, {
    method: "PUT",
    body: group,
  });
}
