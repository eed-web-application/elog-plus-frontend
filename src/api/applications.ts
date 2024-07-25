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
  // FIXME: Remove this when the proper API is implemented

  const applications = [
    {
      id: "1",
      name: "Application Name 1",
      token: "jwt",
      expiration: "2025-02-24",
    },
    {
      id: "2",
      name: "Application Name 2",
      token: "jwt",
      expiration: "2025-02-24",
    },
    {
      id: "3",
      name: "Application Name 3",
      token: "jwt",
      expiration: "2025-02-24",
    },
  ].filter((application) => application.name.includes(search));

  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          includeAuthorizations
            ? applications.map(__createMockAuthorizations)
            : applications,
        ),
      1000,
    );
  });
}

// export async function createApp(name: string, expiration: string) {
//   return await fetch(`v1/auth/application-token`, {
//     method: "POST",
//     body: { name, expiration },
//   });
// }
//
// export async function deleteApp() {
//   return await fetch(`v1/auth/application-token/{id}`, {
//     method: "DELETE",
//   });
// }
