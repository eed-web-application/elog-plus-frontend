import { Authorization, ResourceQuery, fetch } from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export interface Application {
  id: string;
  name: string;
  expiration: string;
  token: string;
  applicationManaged: boolean;
}

export interface ApplicationWithAuth extends Application {
  authorizations: Authorization[];
}

export type ApplicationQuery<A extends boolean | undefined> = ResourceQuery & {
  includeAuthorizations?: A;
};

export function fetchApplication<A extends boolean | undefined>(
  id: string,
  includeAuthorizations?: A,
): Promise<A extends true ? ApplicationWithAuth : Application> {
  return fetch(`v1/applications/${id}`, {
    params: includeAuthorizations ? { includeAuthorizations: "true" } : {},
  });
}

export function fetchApplications<A extends boolean | undefined>(
  query: ApplicationQuery<A>,
): Promise<(A extends true ? ApplicationWithAuth : Application)[]> {
  const params: ParamsObject = Object.assign(
    {
      includeAuthorizations: false,
    },
    query,
  );

  return fetch("v1/applications", { params: serializeParams(params) });
}

export type ApplicationNew = Pick<Application, "name" | "expiration">;

export function createApplication(application: ApplicationNew) {
  return fetch("v1/applications", {
    method: "POST",
    body: application,
  });
}
