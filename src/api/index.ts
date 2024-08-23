import { useImpersonationStore } from "../impersonationStore";

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
  noImpersonating?: boolean;
}

export async function fetch(
  url: string,
  {
    method = "GET",
    headers = {},
    noImpersonating = false,
    body,
    params,
    formData,
    payloadKey = "payload",
    ...restOptions
  }: FetchOptions = {},
) {
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const impersonating = useImpersonationStore.getState().impersonating;
  if (impersonating?.email && !noImpersonating) {
    headers["Impersonate"] = impersonating.email;
  }

  const options: RequestInit = {
    method,
    headers: new Headers(headers),
    body: formData || (body ? JSON.stringify(body) : null),
    redirect: "manual",
    ...restOptions,
  };

  const res = await window.fetch(
    `${ENDPOINT}/${url}?${params ? new URLSearchParams(params).toString() : ""}`,
    options,
  );

  if (res.status === 302) {
    // If the server responds with a 302, it means the user is not logged in
    // and the server is redirecting to the login page. Therefore, we can just
    // refresh the page to redirect the user to the login page.
    window.location.reload();
  }

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

export type ResourceQuery = {
  search?: string;
  anchor?: string;
  limit?: number;
};

export * from "./attachments";
export * from "./applications";
export * from "./authorizations";
export * from "./entries";
export * from "./groups";
export * from "./logbooks";
export * from "./tags";
export * from "./users";
