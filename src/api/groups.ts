import { create } from "zustand";
import { fetch } from ".";
import { AuthorizationPermission } from "./logbooks";

export interface Group {
  id: string;
  name: string;
}

// export interface Group {
//     id: string;
//     name: string;
//     description: string;
//     members: string[];
//     permissions: AuthorizationType[];
// }

export interface GroupsState {
  groups: Record<string, Group>; // Dictionary to store groups by ID
  addGroup: (group: Group) => void; // Function to add a new group
  removeGroup: (groupId: string) => void; // Function to remove a group
  updateGroupMembers: (groupId: string, members: string[]) => void; // Function to update group members
}

export interface GroupAuthorization {
  logbook: string;
  authorizationType: AuthorizationPermission; // Define your AuthorizationType here
}

export interface GroupWithAuth extends Group {
  authorizations: GroupAuthorization[];
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: {}, // Initialize groups as an empty object

  addGroup(group) {
    set((state) => ({
      groups: {
        ...state.groups,
        [group.id]: group,
      },
    }));
  },

  removeGroup(groupId) {
    set((state) => {
      const { [groupId]: removedGroup, ...restGroups } = state.groups; // Remove the group with given groupId
      return { groups: restGroups };
    });
  },

  updateGroupMembers(groupId, members) {
    set((state) => {
      if (!state.groups[groupId]) return state;

      const updatedGroup = {
        ...state.groups[groupId],
        members: [...members],
      };

      return {
        groups: {
          ...state.groups,
          [groupId]: updatedGroup,
        },
      };
    });
  },
}));

export function fetchGroups(search: string): Promise<Group[]> {
  return fetch("v1/auth/groups", { params: { search } });
}
