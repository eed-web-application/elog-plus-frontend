import { fetch, Authorization, ResourceQuery } from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export interface Group {
  id: string;
  name: string;
}

export interface GroupWithAuth extends Group {
  authorizations: Authorization[];
}

export type GroupQuery<A extends boolean | undefined> = ResourceQuery & {
  includeAuthorizations?: A;
};

export function fetchGroup<A extends boolean | undefined>(
  id: string,
  includeAuthorizations?: A,
): Promise<A extends true ? GroupWithAuth : Group> {
  return fetch(`v1/groups/${id}`, {
    params: includeAuthorizations ? { includeAuthorizations: "true" } : {},
  });
}

export function fetchGroups<A extends boolean | undefined>(
  query: GroupQuery<A>,
): Promise<(A extends true ? GroupWithAuth : Group)[]> {
  const params: ParamsObject = Object.assign(
    {
      includeAuthorizations: false,
    },
    query,
  );

  return fetch("v1/groups", { params: serializeParams(params) });
}

export interface GroupNew {
  name: string;
  description: string;
}

export function createGroup(group: GroupNew) {
  return fetch(`v1/groups`, {
    method: "POST",
    body: group,
  });
}
