import { Authorization, fetch } from ".";

export interface Application {
  id: string;
  name: string;
  expiration: string;
  token: string;
}

export interface ApplicationWithAuth extends Application {
  authorizations: Authorization[];
}

function __createMockAuthorizations(
  application: Application,
): ApplicationWithAuth {
  return {
    ...application,
    authorizations: [
      {
        id: "1",
        permission: "Write",
        ownerId: application.id,
        ownerType: "Group",
        ownerLabel: application.name,
        resourceId: "66958c2ee81b14088ef1228f",
        resourceType: "Logbook",
        resouceLabel: "ACCEL",
      },
      {
        id: "2",
        permission: "Read",
        ownerType: "Group",
        ownerId: application.id,
        ownerLabel: application.name,
        resourceId: "66958c2ee81b14088ef12290",
        resourceType: "Logbook",
        resouceLabel: "PEP",
      },
    ],
  };
}

export async function fetchApplications<A extends boolean | undefined>({
  search,
  includeAuthorizations,
}: {
  search: string;
  includeAuthorizations?: A;
}): Promise<(A extends true ? ApplicationWithAuth : Application)[]> {
  // return fetch("v1/groups", { params: { search, includeAuthorizations } });
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
