import { fetch, Authorization } from ".";

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

export async function fetchGroups<A extends boolean | undefined>({
  search,
  includeAuthorizations,
}: {
  search: string;
  includeAuthorizations?: A;
}): Promise<(A extends true ? GroupWithAuth : Group)[]> {
  // return fetch("v1/groups", { params: { search, includeAuthorizations } });
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
  description?: string;
}

export function createGroup(group: GroupNew) {
  return fetch(`v1/groups`, {
    method: "POST",
    body: group,
  });
}
