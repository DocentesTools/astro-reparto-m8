import type { z } from "zod";
import { getRepartoAuthAdapter } from "./authAdapter.js";
import { getRepartoConfig } from "./config.js";
import {
  normalizeFastApiError,
  RepartoApiError,
  RepartoUnauthenticatedError
} from "./errors.js";

export * from "./api/index.js";

export type RepartoRequestBase = "api" | "absolute";

export type RepartoRequestOptions<T> = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  base?: RepartoRequestBase;
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  schema?: z.ZodType<T>;
  auth?: boolean;
  skipRefresh?: boolean;
};

export function repartoUrl(base: RepartoRequestBase, path: string): string {
  const config = getRepartoConfig();
  const origin =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const full =
    base === "absolute" ? path : `${config.apiBase}${config.apiPrefix}${path}`;
  const url = new URL(full, origin);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported reparto API protocol");
  }
  return url.toString();
}

export async function request<T>(
  options: RepartoRequestOptions<T>
): Promise<T> {
  const config = getRepartoConfig();
  const adapter = getRepartoAuthAdapter();
  const url = new URL(repartoUrl(options.base ?? "api", options.path));
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value != null) url.searchParams.set(key, String(value));
  }

  const headers = new Headers({
    [config.csrfHeader]: "XMLHttpRequest",
    ...options.headers
  });
  if (options.auth) {
    let token = await adapter.getAccessToken();
    if (!token && !options.skipRefresh) {
      try {
        token = adapter.refresh ? await adapter.refresh() : null;
      } catch {
        adapter.onUnauthenticated?.("refresh-failed");
        throw new RepartoUnauthenticatedError();
      }
    }
    if (!token) {
      adapter.onUnauthenticated?.(
        options.skipRefresh || !adapter.refresh ? "unauthenticated" : "refresh-failed"
      );
      throw new RepartoUnauthenticatedError();
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const execute = () =>
    fetch(url.toString(), {
      method: options.method,
      headers,
      body,
      credentials: "include"
    });

  let response = await execute();
  if (response.status === 401 && !options.skipRefresh) {
    let refreshed: string | null;
    try {
      refreshed = adapter.refresh ? await adapter.refresh() : null;
    } catch {
      adapter.onUnauthenticated?.("refresh-failed");
      throw new RepartoUnauthenticatedError("Session expired. Please sign in again.");
    }
    if (!refreshed) {
      adapter.onUnauthenticated?.("refresh-failed");
      throw new RepartoUnauthenticatedError("Session expired. Please sign in again.");
    }
    headers.set("Authorization", `Bearer ${refreshed}`);
    response = await execute();
  }

  if (!response.ok) {
    if (response.status === 401) {
      adapter.onUnauthenticated?.("unauthenticated");
      throw new RepartoUnauthenticatedError();
    }
    let detail: unknown;
    try {
      detail = normalizeFastApiError(await response.clone().json());
    } catch {
      detail = await response.text();
    }
    throw new RepartoApiError(response.status, detail);
  }

  if (response.status === 204 || !options.schema) return undefined as T;
  return options.schema.parse(await response.json());
}
