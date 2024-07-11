import { fetch } from ".";

export interface Application{
  id: string;
  name: string;
  email: string;
  expiration: string;
  token: string;
  applicationManaged: boolean;
}

export async function fetchApplications(): Promise<Application[]>{
  return fetch("v1/auth/application-token");
}

export async function createApp(name: string, expiration: string) {
  return await fetch(`v1/auth/application-token`, {
    method: "POST",
    body: { name, expiration },
  });
}

export async function deleteApp(){
  return await fetch(`v1/auth/application-token/{id}`,{
    method: "DELETE",
  })
}