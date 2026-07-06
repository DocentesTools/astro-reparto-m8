import { describe, expect, it, vi } from "vitest";
import faReparto, {
  buildRepartoNav,
  checkAuthOrder,
  DEFAULT_REPARTO_NAV,
  localizedRoutePatterns
} from "../src/integration.js";
import {
  REPARTO_CONTRACT_OPERATIONS,
  REPARTO_CONTRACT_VERSION,
  assertRepartoCompatibility
} from "../src/runtime/compatibility.js";
import { buildRepartoRoutes } from "../src/runtime/routes.js";

describe("routes", () => {
  it("builds defaults and accepts overrides", () => {
    expect(buildRepartoRoutes()).toEqual({
      dashboard: "/reparto",
      meeting: "/reparto/meeting/[processId]",
      processList: "/reparto/processes",
      teacherView: "/reparto/processes/[processId]/my-view",
      sharedScreen: "/reparto/processes/[processId]/shared",
      versions: "/reparto/processes/[processId]/versions",
      exports: "/reparto/processes/[processId]/exports",
      schools: "/reparto/setup/schools",
      academicYears: "/reparto/setup/academic-years",
      departments: "/reparto/setup/departments",
      teacherRoster: "/reparto/setup/teacher-roster"
    });
    expect(buildRepartoRoutes({ dashboard: false, meeting: "/m/[id]" })).toEqual({
      dashboard: false,
      meeting: "/m/[id]",
      processList: "/reparto/processes",
      teacherView: "/reparto/processes/[processId]/my-view",
      sharedScreen: "/reparto/processes/[processId]/shared",
      versions: "/reparto/processes/[processId]/versions",
      exports: "/reparto/processes/[processId]/exports",
      schools: "/reparto/setup/schools",
      academicYears: "/reparto/setup/academic-years",
      departments: "/reparto/setup/departments",
      teacherRoster: "/reparto/setup/teacher-roster"
    });
  });

  it("localizes route patterns when locales are configured", () => {
    expect(localizedRoutePatterns("/reparto/processes", ["en", "fr"])).toEqual([
      "/en/reparto/processes",
      "/fr/reparto/processes"
    ]);
    expect(localizedRoutePatterns("reparto", undefined)).toEqual(["/reparto"]);
  });
});

describe("compatibility", () => {
  it("accepts supported contracts and rejects missing/unknown contracts", () => {
    expect(() =>
      assertRepartoCompatibility({ reparto_contract_version: "reparto-docente-m8@0.1" })
    ).not.toThrow();
    expect(() => assertRepartoCompatibility({ contract_version: "0.1" })).not.toThrow();
    expect(() => assertRepartoCompatibility({ service_version: "x" })).toThrow(
      "Unsupported reparto-docente-m8 contract: unknown"
    );
    expect(() => assertRepartoCompatibility({ contract_version: "2.0" })).toThrow(
      "Unsupported reparto-docente-m8 contract: 2.0"
    );
  });

  it("freezes the backend-facing operation contract for the UI rebuild", () => {
    expect(REPARTO_CONTRACT_VERSION).toBe("reparto-docente-m8@0.1");
    expect(REPARTO_CONTRACT_OPERATIONS["assignmentProcesses.dashboard"]).toEqual({
      method: "GET",
      path: "/assignment-processes/{process_id}/dashboard",
      response: "ProcessDashboard"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["history.restoreDraft"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/restore-draft",
      response: "AssignmentProcessPublic"
    });
    expect(Object.keys(REPARTO_CONTRACT_OPERATIONS)).toHaveLength(28);
  });
});

describe("integration", () => {
  it("warns when auth is missing or ordered after reparto", () => {
    const logger = { warn: vi.fn() };
    expect(() => checkAuthOrder(undefined)).not.toThrow();
    checkAuthOrder([], logger);
    expect(logger.warn).toHaveBeenCalledWith(
      "@mano8/astro-auth-m8 is required for official M8 usage"
    );
    logger.warn.mockClear();
    checkAuthOrder(
      [{ name: "@mano8/astro-reparto-m8" }, { name: "@mano8/astro-auth-m8" }],
      logger
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "@mano8/astro-auth-m8 should be listed before @mano8/astro-reparto-m8"
    );
    logger.warn.mockClear();
    checkAuthOrder(
      [{ name: "@mano8/astro-auth-m8" }, { name: "@mano8/astro-reparto-m8" }],
      logger
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("configures env values and injects starter routes", () => {
    const integration = faReparto({ mode: "starter", auth: { provider: "custom" } });
    const hook = integration.hooks["astro:config:setup"];
    const injectRoute = vi.fn();
    const updateConfig = vi.fn();
    hook?.({
      injectRoute,
      updateConfig,
      config: { integrations: [] },
      logger: { warn: vi.fn() }
    } as never);
    expect(updateConfig).toHaveBeenCalledWith({
      vite: {
        define: {
          "import.meta.env.PUBLIC_FA_REPARTO_API_BASE": "\"/reparto\"",
          "import.meta.env.PUBLIC_FA_REPARTO_API_PREFIX": "\"\""
        }
      }
    });
    expect(injectRoute).toHaveBeenCalledTimes(11);
  });

  it("checks auth order for official starter routes and skips disabled routes", () => {
    const logger = { warn: vi.fn() };
    const injectRoute = vi.fn();
    faReparto({
      mode: "starter",
      routes: { dashboard: false, meeting: "/meeting/[processId]" }
    }).hooks["astro:config:setup"]?.({
      injectRoute,
      updateConfig: vi.fn(),
      config: { integrations: [] },
      logger
    } as never);
    expect(logger.warn).toHaveBeenCalledWith(
      "@mano8/astro-auth-m8 is required for official M8 usage"
    );
    expect(injectRoute).toHaveBeenCalledTimes(10);
  });

  it("injects localized starter routes for Starlight hosts", async () => {
    const injectRoute = vi.fn();
    faReparto({
      mode: "starter",
      auth: { provider: "custom" },
      locales: ["en", "es"]
    }).hooks["astro:config:setup"]?.({
      injectRoute,
      updateConfig: vi.fn(),
      config: { integrations: [] },
      logger: { warn: vi.fn() }
    } as never);

    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/en/reparto",
      entrypoint: "@mano8/astro-reparto-m8/routes/dashboard.astro"
    });
    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/es/reparto/processes/[processId]/my-view",
      entrypoint: "@mano8/astro-reparto-m8/routes/my-view.astro"
    });
    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/en/reparto/setup/schools",
      entrypoint: "@mano8/astro-reparto-m8/routes/schools.astro"
    });
    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/es/reparto/setup/teacher-roster",
      entrypoint: "@mano8/astro-reparto-m8/routes/teacher-roster.astro"
    });
    expect(injectRoute).toHaveBeenCalledTimes(22);
  });

  it("skips routes in headless mode and warns for auth none", () => {
    const headless = faReparto();
    const headlessInjectRoute = vi.fn();
    headless.hooks["astro:config:setup"]?.({
      injectRoute: headlessInjectRoute,
      updateConfig: vi.fn(),
      config: { integrations: [] },
      logger: { warn: vi.fn() }
    } as never);
    expect(headlessInjectRoute).not.toHaveBeenCalled();

    const logger = { warn: vi.fn() };
    faReparto({ mode: "starter", auth: { provider: "none" } }).hooks[
      "astro:config:setup"
    ]?.({
      injectRoute: vi.fn(),
      updateConfig: vi.fn(),
      config: { integrations: [] },
      logger
    } as never);
    expect(logger.warn).toHaveBeenCalledWith(
      "starter routes are enabled without an auth provider"
    );
  });

  it("exposes the default Setup/Process sidebar nav metadata and resolves route hrefs", () => {
    const routes = buildRepartoRoutes();
    const resolved = buildRepartoNav(routes);
    expect(DEFAULT_REPARTO_NAV.setup.labelKey).toBe("nav.group.setup");
    expect(DEFAULT_REPARTO_NAV.setup.entries.map((entry) => entry.labelKey)).toEqual([
      "nav.item.schools",
      "nav.item.academicYears",
      "nav.item.departments",
      "nav.item.teacherRoster"
    ]);
    const schoolsEntry = resolved.setup.entries.find(
      (entry) => entry.labelKey === "nav.item.schools"
    );
    expect(schoolsEntry?.href).toBe("/reparto/setup/schools");
    const dashboardEntry = resolved.process.entries.find(
      (entry) => entry.labelKey === "nav.item.dashboard"
    );
    expect(dashboardEntry?.href).toBe("/reparto");
    const classroomsEntry = resolved.process.entries.find(
      (entry) => entry.labelKey === "nav.item.classrooms"
    );
    expect(classroomsEntry?.href).toBe("#");
    const resolvedMissing = buildRepartoNav(
      buildRepartoRoutes({ dashboard: false })
    );
    const missingDashboard = resolvedMissing.process.entries.find(
      (entry) => entry.labelKey === "nav.item.dashboard"
    );
    expect(missingDashboard?.href).toBe("#");

    const customNav = buildRepartoNav(buildRepartoRoutes(), {
      setup: DEFAULT_REPARTO_NAV.setup,
      process: {
        labelKey: "nav.group.process",
        entries: [
          { labelKey: "nav.item.audit" },
          { labelKey: "nav.item.dashboard", route: "dashboard" },
          { labelKey: "nav.item.exports", href: "/custom/exports" }
        ]
      }
    });
    const [audit, dashboard, exportsEntry] = customNav.process.entries;
    expect(audit.href).toBe("#");
    expect(dashboard.href).toBe("/reparto");
    expect(exportsEntry.href).toBe("/custom/exports");
  });
});
