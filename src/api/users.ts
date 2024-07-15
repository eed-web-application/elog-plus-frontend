import { create } from "zustand";
import { fetch } from ".";
import { AuthorizationPermission } from "./logbooks";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UsersState {
  users: Record<string, User>;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserPermissions: (
    userId: string,
    permissions: AuthorizationPermission[],
  ) => void;
}

export interface UserAuthorization {
  logbook: string;
  authorizationType: AuthorizationPermission;
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

export async function fetchUsers(search: string): Promise<User[]> {
  const users = (await fetch("v1/auth/users", { params: { search } })) as any[];

  // FIXME: Remove this when the proper API is implemented
  return users.map((user) => ({
    id: user.uid,
    name: user.gecos,
    email: user.mail,
  }));
}

export function fetchMe(): Promise<User> {
  return fetch("v1/auth/me");
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
