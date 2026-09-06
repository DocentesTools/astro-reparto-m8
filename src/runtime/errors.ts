export class RepartoApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown) {
    super(messageFromDetail(detail) ?? "Reparto API request failed");
    this.name = "RepartoApiError";
    this.status = status;
    this.detail = detail;
  }
}

export class RepartoUnauthenticatedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "RepartoUnauthenticatedError";
  }
}

/**
 * The structured error body the service is migrating towards: a stable machine
 * `code`, the service's own prose in `message`, and the substitution values in
 * `params`. Three responses already send it (classroom stages, teaching
 * groups); the rest still send a bare string, and both shapes stay readable
 * here for as long as that is true.
 */
export type RepartoErrorDetail = {
  code?: string;
  message?: string;
  params?: Record<string, unknown>;
};

export function normalizeFastApiError(body: unknown): unknown {
  if (isRecord(body) && "detail" in body) return body.detail;
  return body;
}

/**
 * Read a `{code, message, params}` detail object. Returns `undefined` for any
 * other record — a plain object with neither a code nor a message is not a
 * structured error and must keep falling through to the generic handling.
 */
export function structuredDetail(detail: unknown): RepartoErrorDetail | undefined {
  if (!isRecord(detail) || Array.isArray(detail)) return undefined;
  const code = nonEmptyString(detail.code);
  const message = nonEmptyString(detail.message);
  if (code === undefined && message === undefined) return undefined;
  const params =
    isRecord(detail.params) && !Array.isArray(detail.params)
      ? (detail.params as Record<string, unknown>)
      : undefined;
  return { code, message, params };
}

export function messageFromDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") {
    const trimmed = detail.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => (isRecord(entry) ? entry.msg : undefined))
      .filter((value): value is string => typeof value === "string");
    return messages.length > 0 ? messages.join("; ") : undefined;
  }
  return structuredDetail(detail)?.message;
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
