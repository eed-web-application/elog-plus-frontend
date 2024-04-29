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
  return await fetch("/v1/auth/application-token");
}