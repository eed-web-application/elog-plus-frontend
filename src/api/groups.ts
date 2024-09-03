import { fetch, Authorization, ResourceQuery, User } from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export type GroupSummary = {
  id: string;
  name: string;
  description: string;
};

export type Group = GroupSummary & {
  authorizations: Authorization[];
  members: User[];
};

export function fetchGroup(
  id: string,
  options?: ResourceQuery,
): Promise<Group> {
  const params = Object.assign(
    {
      includeAuthorizations: true,
      includeMembers: true,
    },
    options,
  );

  return fetch(`v1/groups/${id}`, {
    params: serializeParams(params),
  });
}

export function fetchGroups(query: ResourceQuery): Promise<GroupSummary[]> {
  const params: ParamsObject = Object.assign(
    {
      includeAuthorizations: false,
      includeMembers: false,
    },
    query,
  );

  return fetch("v1/groups", { params: serializeParams(params) });
}

export type GroupNew = Pick<GroupSummary, "name" | "description"> & {
  members: string[];
};

export function createGroup(group: GroupNew) {
  return fetch(`v1/groups`, {
    method: "POST",
    body: group,
  });
}

export type GroupUpdation = Pick<
  GroupSummary,
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
