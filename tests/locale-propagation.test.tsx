import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { request } from "../src/runtime/client.js";
import {
  configureReparto,
  getRepartoConfig,
  resetRepartoConfig
} from "../src/runtime/config.js";
import { RepartoProvider } from "../src/runtime/react/RepartoProvider.js";

const fetchMock = vi.fn();

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.tsx?$/.test(name)
        ? [path]
        : [];
  });
}

beforeEach(() => {
  resetRepartoConfig();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("route locale propagation", () => {
  it.each([
    { routeLocale: "es", browserLocale: "en-US" },
    { routeLocale: "fr", browserLocale: "es-ES" }
  ])(
    "uses route $routeLocale instead of browser $browserLocale",
    async ({ routeLocale, browserLocale }) => {
      vi.stubGlobal("navigator", { language: browserLocale });
      renderToStaticMarkup(
        <RepartoProvider locale={routeLocale}>
          <span />
        </RepartoProvider>
      );
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await request({ method: "GET", path: "/locale-probe" });

      expect(getRepartoConfig().locale).toBe(routeLocale);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Headers).get("Accept-Language")).toBe(routeLocale);
    }
  );

  it("normalizes an unsupported provider locale to English", () => {
    renderToStaticMarkup(
      <RepartoProvider locale="de-DE">
        <span />
      </RepartoProvider>
    );
    expect(getRepartoConfig().locale).toBe("en");
  });

  it("accepts a config locale and preserves an earlier explicit configuration", () => {
    renderToStaticMarkup(
      <RepartoProvider config={{ locale: "fr" }}>
        <span />
      </RepartoProvider>
    );
    expect(getRepartoConfig().locale).toBe("fr");

    configureReparto({ locale: "es" });
    renderToStaticMarkup(
      <RepartoProvider>
        <span />
      </RepartoProvider>
    );
    expect(getRepartoConfig().locale).toBe("es");
  });

  it("routes every default view locale through its provider shell", () => {
    const root = resolve("src/runtime/react/default-ui");
    const source = sourceFiles(root)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(source).not.toContain("<Shell config={config}>");
    expect(source.match(/<Shell config=\{config\} locale=\{/g)).toHaveLength(22);
  });
});
