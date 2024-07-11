import { create } from "zustand";
import { fetch } from ".";
import { AuthorizationType } from "./logbooks";

interface User {
  id: string;
  name: string;
  email: string;
  permissions: AuthorizationType[];
}

interface UsersState {
  users: Record<string, User>;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserPermissions: (
    userId: string,
    permissions: AuthorizationType[],
  ) => void;
}

export interface UserAuthorization {
  logbook: string;
  authorizationType: AuthorizationType;
}

export interface UserWithAuth extends User {
  authorizations: UserAuthorization[];
}

export async function updateUser(user: UserWithAuth) {
  return await fetch(`v1/users/${user.id}`, {
    method: "PUT",
    body: user,
  });
}

export const useUsersStore = create<UsersState>((set) => ({
  users: {},
  addUser(user) {
    set((state) => ({
      users: {
        ...state.users,
        [user.id]: user,
      },
    }));
  },
  removeUser(userId) {
    set((state) => {
      const { [userId]: removedUser, ...restUsers } = state.users;
      return { users: restUsers };
    });
  },
  updateUserPermissions(userId, permissions) {
    set((state) => {
      if (!state.users[userId]) return state;

      const updatedUser = {
        ...state.users[userId],
        permissions: [...permissions],
      };

      return {
        users: {
          ...state.users,
          [userId]: updatedUser,
        },
      };
    });
  },
}));
