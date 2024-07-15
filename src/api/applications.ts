import { fetch } from ".";

export interface Application {
  id: string;
  name: string;
  expiration: string;
  token: string;
}

export async function fetchApplications(
  search: string,
): Promise<Application[]> {
  // return fetch("v1/groups", { params: { search } });
  // FIXME: Remove this when the proper API is implemented
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          [
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
          ].filter((application) => application.name.includes(search)),
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
