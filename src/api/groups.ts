import { fetch, Authorization, ResourceQuery } from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export interface Group {
  id: string;
  name: string;
}

export interface GroupWithAuth extends Group {
  authorizations: Authorization[];
}

function __createMockAuthorizations(group: Group): GroupWithAuth {
  return {
    ...group,
    authorizations: [
      {
        id: "1",
        permission: "Write",
        ownerId: group.id,
        ownerType: "Group",
        ownerLabel: group.name,
        resourceId: "66958c2ee81b14088ef1228f",
        resourceType: "Logbook",
        resouceLabel: "ACCEL",
      },
      {
        id: "2",
        permission: "Read",
        ownerType: "Group",
        ownerId: group.id,
        ownerLabel: group.name,
        resourceId: "66958c2ee81b14088ef12290",
        resourceType: "Logbook",
        resouceLabel: "PEP",
      },
    ],
  };
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

export async function fetchGroups<A extends boolean | undefined>(
  query: GroupQuery<A>,
): Promise<(A extends true ? GroupWithAuth : Group)[]> {
  const params: ParamsObject = Object.assign(
    {
      includeAuthorizations: false,
    },
    query,
  );

  return fetch("v1/groups", { params: serializeParams(params) });
  // FIXME: Remove this when the proper API is implemented

  const groups = [
    { id: "1", name: "Group 1" },
    { id: "2", name: "Group 2" },
    { id: "3", name: "Group 3" },
  ].filter((group) => group.name.toLowerCase().includes(search.toLowerCase()));

  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          includeAuthorizations
            ? groups.map(__createMockAuthorizations)
            : groups,
        ),
      1000,
    );
  });
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
