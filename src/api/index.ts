export const ENDPOINT = "/api/v1";

export class NotFoundError extends Error {
  constructor() {
    super("Could not find resource");
    this.name = "NotFoundError";
  }
}

interface FetchOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: object;
  formData?: FormData;
  headers?: Record<string, string>;
  params?: ConstructorParameters<typeof URLSearchParams>[0];
}

export async function fetch(
  url: string,
  {
    method = "GET",
    headers = {},
    body,
    params,
    formData,
    ...restOptions
  }: FetchOptions = {}
) {
  if (body) {
    headers["content-type"] = "application/json";
  }

  const options = {
    method,
    headers: new Headers(headers),
    body: formData || (body ? JSON.stringify(body) : null),
    ...restOptions,
  };

  const res = await window.fetch(
    `${ENDPOINT}/${url}?${
      params ? new URLSearchParams(params).toString() : ""
    }`,
    options
  );

  if (!res.ok) {
    if (res.status === 404) {
      throw new NotFoundError();
    }

    // TODO: Provide better error handling
    const errorText = await res.text();
    throw new Error(
      `Network response was not as expected: ${res.status} ${errorText}`
    );
  }

  const responseData = await res.json();

  if (responseData.errorCode !== 0) {
    // TODO: Same here
    throw new Error(responseData.errorMessage);
  }

  return responseData.payload;
}

export * from "./attachments";
export * from "./entries";
export * from "./logbooks";
export * from "./tags";
