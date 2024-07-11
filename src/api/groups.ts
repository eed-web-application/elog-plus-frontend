import { create } from "zustand";
import { AuthorizationType } from "./logbooks";
import { Group } from "./auth";

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
  authorizationType: AuthorizationType; // Define your AuthorizationType here
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

// Example function to update group details (replace with your actual implementation)
export async function updateGroup(group: Group) {
  return await fetch(`v1/groups/${group.id}`, {
    method: "PUT",
    body: JSON.stringify(group),
    headers: {
      "Content-Type": "application/json",
    },
  });
}
