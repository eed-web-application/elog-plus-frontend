// FIXME:
export const MOCK_GROUPS = [
  "group-1",
  "group-2",
  "group-3",
  "group-4",
  "group-5",
  "group-6",
];

export async function fetchGroups(): Promise<string[]> {
  return MOCK_GROUPS;
}
