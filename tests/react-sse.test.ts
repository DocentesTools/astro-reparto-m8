import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetRepartoAuthAdapter,
  setRepartoAuthAdapter,
  type RepartoAuthAdapter
} from "../src/runtime/authAdapter.js";
import {
  configureReparto,
  resetRepartoConfig
} from "../src/runtime/config.js";
import { RepartoUnauthenticatedError } from "../src/runtime/errors.js";
import {
  consumeRepartoEventStream
} from "../src/runtime/react/useRepartoEvents.js";
import type { SseAudience } from "../src/runtime/schemas.js";
import type { RepartoSseEvent } from "../src/runtime/sse.js";

const processId = "11111111-1111-4111-8111-111111111111";
const occurredAt = "2026-08-02T10:00:00Z";
const fetchMock = vi.fn();

function streamResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame));
      controller.close();
    }
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" }
  });
}

function openedFrame(): string {
  return `event: stream.opened\ndata: ${JSON.stringify({
    event_type: "stream.opened",
    process_id: processId,
    sequence: 0,
    occurred_at: occurredAt,
    readiness: "ready",
    selection_blocked: false,
    payload: { audience: "department_head" },
    subject_process_teacher_id: null
  })}\n\n`;
}

function callbacks() {
  const events: RepartoSseEvent[] = [];
  const onActivity = vi.fn();
  return {
    events,
    onActivity,
    callbacks: {
      onActivity,
      onEvent: (event: RepartoSseEvent) => events.push(event)
    }
  };
}

beforeEach(() => {
  resetRepartoConfig();
  resetRepartoAuthAdapter();
  configureReparto({ apiBase: "/reparto", apiPrefix: "" });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authenticated React SSE transport", () => {
  it("sends the bearer and audience, accepts split frames, and counts heartbeats", async () => {
    setRepartoAuthAdapter({ getAccessToken: () => "token" });
    const frame = openedFrame();
    fetchMock.mockResolvedValueOnce(
      streamResponse([frame.slice(0, 25), frame.slice(25), ": keep-alive\n\n"])
    );
    const observed = callbacks();

    await consumeRepartoEventStream(
      processId,
      "department_head",
      new AbortController().signal,
      observed.callbacks
    );

    expect(observed.events).toHaveLength(1);
    expect(observed.events[0].eventType).toBe("stream.opened");
    expect(observed.onActivity).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/${processId}/events?audience=department_head`);
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer token");
    expect(init.credentials).toBe("include");
  });

  it("refreshes a missing token and retries one 401 with the new bearer", async () => {
    const refresh = vi.fn().mockResolvedValue("fresh");
    setRepartoAuthAdapter({ getAccessToken: () => null, refresh });
    fetchMock.mockResolvedValueOnce(streamResponse([openedFrame()]));
    await consumeRepartoEventStream(
      processId,
      "department_head",
      new AbortController().signal,
      callbacks().callbacks
    );
    expect(refresh).toHaveBeenCalledTimes(1);

    refresh.mockClear();
    setRepartoAuthAdapter({ getAccessToken: () => "expired", refresh });
    fetchMock
      .mockReset()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(streamResponse([openedFrame()]));
    await consumeRepartoEventStream(
      processId,
      "department_head",
      new AbortController().signal,
      callbacks().callbacks
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(
      (fetchMock.mock.calls[1][1] as RequestInit).headers
    ).toBeInstanceOf(Headers);
    expect(
      ((fetchMock.mock.calls[1][1] as RequestInit).headers as Headers).get(
        "Authorization"
      )
    ).toBe("Bearer fresh");
  });

  it("refuses a process id or audience that is not the shape the service issues", async () => {
    setRepartoAuthAdapter({ getAccessToken: () => "token" });

    for (const bad of [
      `${processId}/../../admin`,
      `${processId}?audience=department_head`,
      `${processId}#x`,
      "not-a-uuid",
      ""
    ]) {
      await expect(
        consumeRepartoEventStream(
          bad,
          "teacher",
          new AbortController().signal,
          callbacks().callbacks
        )
      ).rejects.toThrow(/process id in UUID form/);
    }

    await expect(
      consumeRepartoEventStream(
        processId,
        "administrator" as SseAudience,
        new AbortController().signal,
        callbacks().callbacks
      )
    ).rejects.toThrow(/known audience/);

    // The point of the guard: nothing reached the network.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed for authentication, HTTP, content, body and frame errors", async () => {
    const onUnauthenticated = vi.fn();
    const noToken: RepartoAuthAdapter = {
      getAccessToken: () => null,
      onUnauthenticated
    };
    setRepartoAuthAdapter(noToken);
    await expect(
      consumeRepartoEventStream(
        processId,
        "teacher",
        new AbortController().signal,
        callbacks().callbacks
      )
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(onUnauthenticated).toHaveBeenCalledWith("unauthenticated");

    const refreshFailed = vi.fn();
    setRepartoAuthAdapter({
      getAccessToken: () => null,
      refresh: () => {
        throw new Error("refresh failed");
      },
      onUnauthenticated: refreshFailed
    });
    await expect(
      consumeRepartoEventStream(
        processId,
        "teacher",
        new AbortController().signal,
        callbacks().callbacks
      )
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(refreshFailed).toHaveBeenCalledWith("refresh-failed");

    setRepartoAuthAdapter({ getAccessToken: () => "token" });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(
      consumeRepartoEventStream(
        processId,
        "teacher",
        new AbortController().signal,
        callbacks().callbacks
      )
    ).rejects.toThrow(/HTTP 503/);

    fetchMock.mockResolvedValueOnce(new Response("json", { status: 200 }));
    await expect(
      consumeRepartoEventStream(
        processId,
        "teacher",
        new AbortController().signal,
        callbacks().callbacks
      )
    ).rejects.toThrow(/content type/);

    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" }
      })
    );
    await expect(
      consumeRepartoEventStream(
        processId,
        "teacher",
        new AbortController().signal,
        callbacks().callbacks
      )
    ).rejects.toThrow(/no readable body/);

    fetchMock.mockResolvedValueOnce(streamResponse(["data: {}\n\n"]));
    await expect(
      consumeRepartoEventStream(
        processId,
        "teacher",
        new AbortController().signal,
        callbacks().callbacks
      )
    ).rejects.toThrow(/malformed SSE frame/);
  });
});
