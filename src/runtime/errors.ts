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

export function normalizeFastApiError(body: unknown): unknown {
  if (isRecord(body) && "detail" in body) return body.detail;
  return body;
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
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
