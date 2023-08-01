export const ENDPOINT = import.meta.env.API_ENDPOINT || "/api/v1";

interface ErrorContext {
  errorCode: number;
  errorDomain: string;
}

export abstract class ServerError extends Error {
  res: Response;
  context?: ErrorContext;

  constructor(message: string, res: Response, context?: ErrorContext) {
    super(message);
    this.res = res;
    this.name = "ServerError";
    this.context = context;
  }
}

export class InternalServerError extends ServerError {
  constructor(res: Response, context?: ErrorContext) {
    super("Internal server error", res, context);
    this.name = "InternalServerError";
  }
}

export class NotFoundError extends ServerError {
  constructor(res: Response, context?: ErrorContext) {
    super("Could not find resource", res, context);
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

  let responseData;
  try {
    responseData = await res.json();
  } catch {
    // Let responseData be undefined
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new NotFoundError(res, responseData);
    } else {
      throw new InternalServerError(res, responseData);
    }
  }

  return responseData.payload;
}

export * from "./attachments";
export * from "./entries";
export * from "./logbooks";
export * from "./tags";
