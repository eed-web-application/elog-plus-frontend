export const ENDPOINT = import.meta.env.API_ENDPOINT || "/api/elog";

interface ErrorContext {
  errorCode?: number;
  errorDomain?: string;
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

export class UnauthorizedError extends ServerError {
  constructor(res: Response, context?: ErrorContext) {
    super("Unauthorized", res, context);
    this.name = "UnauthorizedError";
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
  payloadKey?: string;
}

export function __SET_DEV_ACCESS_CODE(code: string | null) {
  if (code === null) {
    localStorage.removeItem("dev-vouch-idp-accesstoken");
    return;
  }

  localStorage.setItem("dev-vouch-idp-accesstoken", code);
}

export function __GET_DEV_ACCESS_CODE() {
  return localStorage.getItem("dev-vouch-idp-accesstoken");
}

export async function fetch(
  url: string,
  {
    method = "GET",
    headers = {},
    body,
    params,
    formData,
    payloadKey = "payload",
    ...restOptions
  }: FetchOptions = {},
) {
  headers["content-type"] = "application/json";

  if (import.meta.env.MODE === "development" && __GET_DEV_ACCESS_CODE()) {
    headers["x-vouch-idp-accesstoken"] = __GET_DEV_ACCESS_CODE() || "";
  }

  const options = {
    method,
    headers: new Headers(headers),
    body: formData || (body ? JSON.stringify(body) : null),
    ...restOptions,
  };

  const res = await window.fetch(
    `${ENDPOINT}/${url}?${params ? new URLSearchParams(params).toString() : ""
    }`,
    options,
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
    } else if (res.status === 401) {
      throw new UnauthorizedError(res, responseData);
    } else {
      throw new InternalServerError(res, responseData);
    }
  }

  return responseData[payloadKey];
}

export interface ServerVersion {
  name: string;
  version: string;
}

export async function fetchVersion(): Promise<ServerVersion | undefined> {
  return await fetch("actuator/info", { payloadKey: "build" });
}

export * from "./attachments";
export * from "./applications";
export * from "./authorizations";
export * from "./entries";
export * from "./groups";
export * from "./logbooks";
export * from "./tags";
export * from "./users";
