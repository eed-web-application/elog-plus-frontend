import { Authorization, ResourceQuery, fetch } from ".";
import serializeParams, { ParamsObject } from "../utils/serializeParams";

export interface Application {
  id: string;
  name: string;
  expiration: string;
  token: string;
}

export interface ApplicationWithAuth extends Application {
  authorizations: Authorization[];
}

export type ApplicationQuery<A extends boolean | undefined> = ResourceQuery & {
  includeAuthorizations?: A;
};
//
// function __createMockAuthorizations(
//   application: Application,
// ): ApplicationWithAuth {
//   return {
//     ...application,
//     authorizations: [
//       {
//         id: "1",
//         permission: "Write",
//         ownerId: application.id,
//         ownerType: "Group",
//         ownerName: application.name,
//         resourceId: "66958c2ee81b14088ef1228f",
//         resourceType: "Logbook",
//         resourceName: "ACCEL",
//       },
//       {
//         id: "2",
//         permission: "Read",
//         ownerType: "Group",
//         ownerId: application.id,
//         ownerName: application.name,
//         resourceId: "66958c2ee81b14088ef12290",
//         resourceType: "Logbook",
//         resourceName: "PEP",
//       },
//     ],
//   };
// }
//

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

export interface ApplicationNew {
  name: string;
  expiration: string;
}

export function createApplication(application: ApplicationNew) {
  return fetch("v1/applications", {
    method: "POST",
    body: application,
  });
}
