import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { assignmentProcesses } from "../api/assignmentProcesses.js";
import { getRepartoAuthAdapter } from "../authAdapter.js";
import { getRepartoConfig } from "../config.js";
import { RepartoUnauthenticatedError } from "../errors.js";
import { repartoKeys, resolveProcessId } from "../queryKeys.js";
import {
  INITIAL_REPARTO_SSE_CURSOR,
  advanceRepartoSseCursor,
  parseRepartoSseEvent,
  repartoSseInvalidationKeys,
  type RepartoSseCursor,
  type RepartoSseEvent
} from "../sse.js";
import type { SseAudience, SseEventType } from "../schemas.js";
import {
  getLanConnectionState,
  type LanConnectionState
} from "../ui/lan.js";

const RECONNECT_DELAY_MS = 1_000;
const DEFAULT_STALE_AFTER_MS = 20_000;

/**
 * The process id is interpolated into the stream URL's path, and `queryKeys.ts`
 * only trims it. Constrain it to the UUID form the service issues before it can
 * reach a request: a value carrying `/`, `?`, `#` or `..` would otherwise add
 * path segments or a query to the URL the bearer token is sent with.
 */
const PROCESS_ID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** The audiences the service serves; anything else never reaches the query. */
const STREAM_AUDIENCES: readonly SseAudience[] = [
  "department_head",
  "teacher",
  "shared_screen"
];

export type RepartoEventStreamState = {
  connectionState: LanConnectionState;
  error: unknown;
  lastEventAtMs: number | null;
  lastEventType: SseEventType | null;
};

const DISCONNECTED_EVENT_STATE: RepartoEventStreamState = {
  connectionState: "disconnected",
  error: null,
  lastEventAtMs: null,
  lastEventType: null
};

type FrameCallbacks = {
  onActivity: () => void;
  onEvent: (event: RepartoSseEvent) => void;
};

/**
 * Consume the bearer-authenticated stream. Native EventSource cannot attach the
 * package auth adapter's Authorization header, so the React client reads the
 * Fetch body while preserving the server's standard SSE framing and heartbeat.
 */
export async function consumeRepartoEventStream(
  processId: string,
  audience: SseAudience,
  signal: AbortSignal,
  callbacks: FrameCallbacks
): Promise<void> {
  if (!PROCESS_ID.test(processId)) {
    throw new Error("Reparto event stream needs a process id in UUID form.");
  }
  if (!STREAM_AUDIENCES.includes(audience)) {
    throw new Error("Reparto event stream needs a known audience.");
  }
  // Built only after both inputs are constrained above, so nothing user-shaped
  // reaches the URL unvalidated.
  const target = assignmentProcesses.eventsUrl(processId, audience);

  const adapter = getRepartoAuthAdapter();
  const config = getRepartoConfig();
  let token = await adapter.getAccessToken();
  if (!token) {
    try {
      token = adapter.refresh ? await adapter.refresh() : null;
    } catch {
      adapter.onUnauthenticated?.("refresh-failed");
      throw new RepartoUnauthenticatedError();
    }
  }
  if (!token) {
    adapter.onUnauthenticated?.("unauthenticated");
    throw new RepartoUnauthenticatedError();
  }

  const headers = new Headers({
    Accept: "text/event-stream",
    [config.csrfHeader]: "XMLHttpRequest",
    Authorization: `Bearer ${token}`
  });
  const execute = () =>
    fetch(target, {
      method: "GET",
      headers,
      credentials: "include",
      signal
    });

  let response = await execute();
  if (response.status === 401) {
    let refreshed: string | null;
    try {
      refreshed = adapter.refresh ? await adapter.refresh() : null;
    } catch {
      adapter.onUnauthenticated?.("refresh-failed");
      throw new RepartoUnauthenticatedError();
    }
    if (!refreshed) {
      adapter.onUnauthenticated?.("refresh-failed");
      throw new RepartoUnauthenticatedError();
    }
    headers.set("Authorization", `Bearer ${refreshed}`);
    response = await execute();
  }
  if (!response.ok) {
    if (response.status === 401) {
      adapter.onUnauthenticated?.("unauthenticated");
      throw new RepartoUnauthenticatedError();
    }
    throw new Error(`Reparto event stream failed with HTTP ${response.status}.`);
  }
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    throw new Error("Reparto event stream returned an unexpected content type.");
  }
  if (!response.body) {
    throw new Error("Reparto event stream returned no readable body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let chunk = await reader.read();
  while (!chunk.done) {
    buffer += decoder.decode(chunk.value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      callbacks.onActivity();
      if (frame.startsWith(":")) continue;
      const lines = frame.split("\n");
      const eventLine = lines.find((line) => line.startsWith("event:"));
      const dataLines = lines.filter((line) => line.startsWith("data:"));
      if (!eventLine || dataLines.length === 0) {
        throw new Error("Reparto event stream returned a malformed SSE frame.");
      }
      callbacks.onEvent(
        parseRepartoSseEvent(
          eventLine.slice("event:".length).trim(),
          dataLines.map((line) => line.slice("data:".length).trimStart()).join("\n"),
          audience
        )
      );
    }
    chunk = await reader.read();
  }
}

/** Subscribe one selected process and keep its query projections current. */
export function useRepartoEventStream(
  processId?: string,
  audience: SseAudience = "department_head",
  staleAfterMs = DEFAULT_STALE_AFTER_MS
): RepartoEventStreamState {
  const queryClient = useQueryClient();
  const resolvedProcessId = resolveProcessId(processId);
  const [lastEventAtRef] = useState<{ current: number | null }>(() => ({
    current: null
  }));
  const [state, setState] = useState<RepartoEventStreamState>(
    DISCONNECTED_EVENT_STATE
  );

  useEffect(() => {
    if (!resolvedProcessId) {
      lastEventAtRef.current = null;
      setState(DISCONNECTED_EVENT_STATE);
      return;
    }

    let active = true;
    let cursor: RepartoSseCursor = INITIAL_REPARTO_SSE_CURSOR;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const markActivity = () => {
      const now = Date.now();
      lastEventAtRef.current = now;
      setState((current) => ({
        ...current,
        connectionState: "live",
        error: null,
        lastEventAtMs: now
      }));
    };

    const acceptEvent = (event: RepartoSseEvent) => {
      const now = Date.now();
      const update = advanceRepartoSseCursor(cursor, event, now);
      cursor = update.cursor;
      lastEventAtRef.current = now;
      const keys = update.requiresFullRefetch
        ? [repartoKeys.process(resolvedProcessId)]
        : repartoSseInvalidationKeys(resolvedProcessId, event.eventType);
      for (const queryKey of keys) {
        void queryClient.invalidateQueries({ queryKey });
      }
      setState({
        connectionState: "live",
        error: null,
        lastEventAtMs: now,
        lastEventType: event.eventType
      });
    };

    const reconnect = () =>
      new Promise<void>((resolve) => {
        reconnectTimer = setTimeout(resolve, RECONNECT_DELAY_MS);
      });

    const run = async () => {
      while (active) {
        try {
          await consumeRepartoEventStream(resolvedProcessId, audience, controller.signal, {
            onActivity: markActivity,
            onEvent: acceptEvent
          });
        } catch (error) {
          if (!active || controller.signal.aborted) return;
          setState((current) => ({
            ...current,
            connectionState: "disconnected",
            error
          }));
        }
        if (!active) return;
        setState((current) => ({
          ...current,
          connectionState: "disconnected"
        }));
        await reconnect();
      }
    };

    void run();
    const freshnessTimer = setInterval(() => {
      const connectionState = getLanConnectionState(
        lastEventAtRef.current,
        Date.now(),
        staleAfterMs
      );
      setState((current) =>
        current.connectionState === connectionState
          ? current
          : { ...current, connectionState }
      );
    }, Math.min(Math.max(staleAfterMs, 250), 1_000));

    return () => {
      active = false;
      controller.abort();
      clearInterval(freshnessTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [audience, queryClient, resolvedProcessId, staleAfterMs]);

  return state;
}
