export interface Group {
  id: string;
  name: string;
}

export function fetchGroups(search: string): Promise<Group[]> {
  // return fetch("v1/groups", { params: { search } });
  // FIXME: Remove this when the proper API is implemented
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          [
            { id: "1", name: "Group 1" },
            { id: "2", name: "Group 2" },
            { id: "3", name: "Group 3" },
          ].filter((group) => group.name.includes(search)),
        ),
      1000,
    );
  });
}
