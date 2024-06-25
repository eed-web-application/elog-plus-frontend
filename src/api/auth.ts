import { fetch } from ".";

export interface Group {
  uid: string;
  commonName: string;
}

export interface User {
  uid: string;
  commonName: string;
  surname: string;
  gecos: string;
  mail: string;
}

export function fetchGroups(search: string): Promise<Group[]> {
  return fetch("v1/auth/groups", { params: { search } });
}

export function fetchUsers(search: string): Promise<User[]> {
  return fetch("v1/auth/users", { params: { search } });
}

export function fetchMe(): Promise<User> {
  return fetch("v1/auth/me");
}

export function logbookAuth(){
  return fetch("/v1/logbook/auth");
}

