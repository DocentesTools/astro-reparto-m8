import { describe, expect, it, vi } from "vitest";
import faReparto, {
  buildRepartoNav,
  checkAuthOrder,
  DEFAULT_REPARTO_NAV,
  localizedRoutePatterns,
  repartoRoutePrefixes
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
      teacherRoster: "/reparto/setup/teacher-roster",
      subjects: "/reparto/processes/[processId]/subjects",
      teachingGroups: "/reparto/processes/[processId]/teaching-groups",
      classroomStages: "/reparto/setup/classroom-stages",
      groupSubjects: "/reparto/processes/[processId]/group-subjects",
      processSettings: "/reparto/processes/[processId]/settings",
      allocation: "/reparto/processes/[processId]/allocation",
      planning: "/reparto/processes/[processId]/planning",
      requirements: "/reparto/processes/[processId]/requirements",
      participants: "/reparto/processes/[processId]/participants",
      assignments: "/reparto/processes/[processId]/assignments",
      audit: "/reparto/processes/[processId]/audit"
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
      teacherRoster: "/reparto/setup/teacher-roster",
      subjects: "/reparto/processes/[processId]/subjects",
      teachingGroups: "/reparto/processes/[processId]/teaching-groups",
      classroomStages: "/reparto/setup/classroom-stages",
      groupSubjects: "/reparto/processes/[processId]/group-subjects",
      processSettings: "/reparto/processes/[processId]/settings",
      allocation: "/reparto/processes/[processId]/allocation",
      planning: "/reparto/processes/[processId]/planning",
      requirements: "/reparto/processes/[processId]/requirements",
      participants: "/reparto/processes/[processId]/participants",
      assignments: "/reparto/processes/[processId]/assignments",
      audit: "/reparto/processes/[processId]/audit"
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
      assertRepartoCompatibility({ reparto_contract_version: "reparto-docente-m8@2.0.0" })
    ).not.toThrow();
    // A bare "2.0.0" is only admitted once contract.name has identified the
    // service: unqualified, it is any sibling's version number.
    expect(() =>
      assertRepartoCompatibility({
        contract_version: "2.0.0",
        contract: { name: "reparto-docente-m8" }
      })
    ).not.toThrow();
    expect(() => assertRepartoCompatibility({ contract_version: "2.0.0" })).toThrow(
      "Unsupported reparto-docente-m8 contract: 2.0.0"
    );
    expect(() => assertRepartoCompatibility({ service_version: "x" })).toThrow(
      "Unsupported reparto-docente-m8 contract: unknown"
    );
    expect(() => assertRepartoCompatibility({ contract_version: "0.1" })).toThrow(
      "Unsupported reparto-docente-m8 contract: 0.1"
    );
  });

  it("rejects another service's /meta even when its contract version matches", () => {
    // Every M8 service serves this payload shape from the shared auth-sdk-m8
    // `mount_service_meta` helper, and prompt-engine-m8 serves exactly
    // contract.version "2.0.0" — the digits this guard expects. Before the name
    // check a host pointed at the prompt engine read as valid reparto.
    const promptEngineMeta = {
      service: "PromptEngineM8",
      version: "2.0.0",
      api_version: "v1",
      contract: {
        name: "prompt-engine-m8",
        version: "2.0.0",
        range: ">=2.0.0 <3.0.0"
      }
    };
    expect(() => assertRepartoCompatibility(promptEngineMeta)).toThrow(
      "Expected the reparto-docente-m8 contract, received the prompt-engine-m8 contract"
    );
    // The wrong service is named as a wrong service, not as a version mismatch.
    expect(() => assertRepartoCompatibility(promptEngineMeta)).not.toThrow(
      /Unsupported reparto-docente-m8 contract/
    );
    // Name mismatch wins over an otherwise supported flat legacy contract too.
    expect(() =>
      assertRepartoCompatibility({
        reparto_contract_version: REPARTO_CONTRACT_VERSION,
        contract: { name: "prompt-engine-m8", version: "2.0.0" }
      })
    ).toThrow("received the prompt-engine-m8 contract");
  });

  it("admits the live reparto-docente-m8 GET /meta payload verbatim", () => {
    // Verbatim auth-sdk-m8 ServiceMeta as reparto-docente-m8 serves it at
    // {API_PREFIX}/meta: the contract identity is nested under `contract`, and
    // the flat `*_contract_version` keys the guard used to read exclusively are
    // absent — so this payload made the guard throw against its own service.
    const meta = {
      service: "M8FastApi",
      version: "1.0.0",
      api_version: "v1",
      contract: {
        name: "reparto-docente-m8",
        version: "2.0.0",
        range: ">=2.0.0 <3.0.0"
      }
    };
    expect(() => assertRepartoCompatibility(meta)).not.toThrow();

    // Adjacent out-of-range contract version on the same payload shape.
    expect(() =>
      assertRepartoCompatibility({ ...meta, contract: { ...meta.contract, version: "3.0.0" } })
    ).toThrow("Unsupported reparto-docente-m8 contract: 3.0.0");
    // A nested contract carrying no version is still "unknown", not admitted.
    expect(() => assertRepartoCompatibility({ ...meta, contract: {} })).toThrow(
      "Unsupported reparto-docente-m8 contract: unknown"
    );
  });

  it("prefers the flat legacy keys over the nested contract object", () => {
    expect(() =>
      assertRepartoCompatibility({
        reparto_contract_version: "reparto-docente-m8@2.0.0",
        contract: { name: "reparto-docente-m8", version: "0.1" }
      })
    ).not.toThrow();
    // A flat contract string (no nested object at all) is still read.
    expect(() =>
      assertRepartoCompatibility({ contract: "reparto-docente-m8@2.0.0" })
    ).not.toThrow();
    // Blank strings are ignored rather than admitted as a contract.
    expect(() => assertRepartoCompatibility({ contract_version: "   " })).toThrow(
      "Unsupported reparto-docente-m8 contract: unknown"
    );
  });

  it("freezes the backend-facing operation contract for the UI rebuild", () => {
    expect(REPARTO_CONTRACT_VERSION).toBe("reparto-docente-m8@2.0.0");
    expect(REPARTO_CONTRACT_OPERATIONS["assignmentProcesses.dashboard"]).toEqual({
      method: "GET",
      path: "/assignment-processes/{process_id}/dashboard",
      response: "ProcessDashboard"
    });
    // Draft and provisional planning artifacts are their own operations, not a
    // mode parameter on one: only the final mode may be refused (plan §7.8).
    expect(
      REPARTO_CONTRACT_OPERATIONS["planningExchange.exportDraft"]
    ).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/exports/planning-draft",
      response: "PlanningExportArtifact"
    });
    expect(
      REPARTO_CONTRACT_OPERATIONS["planningExchange.exportProvisional"]
    ).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/exports/planning-provisional",
      response: "PlanningExportArtifact"
    });
    expect(
      REPARTO_CONTRACT_OPERATIONS["planningExchange.exportFinal"]
    ).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/exports/planning-final",
      response: "PlanningExportArtifact"
    });
    expect(
      REPARTO_CONTRACT_OPERATIONS["planningExchange.importPlanning"]
    ).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/imports/planning",
      response: "PlanningImportResult"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["history.restoreDraft"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/restore-draft",
      response: "AssignmentProcessPublic"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["allocationRevisions.current"]).toEqual({
      method: "GET",
      path: "/assignment-processes/{process_id}/allocation-revisions/current",
      response: "DepartmentHourAllocationRevisionPublic"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["groupSubjects.bulkApply"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/group-subjects/bulk-apply",
      response: "GroupSubjectBulkResult"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["groupSubjects.retire"]).toEqual({
      method: "POST",
      path:
        "/assignment-processes/{process_id}/group-subjects/{group_subject_id}/retire",
      response: "GroupSubjectPublic"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["teachingActivities.retire"]).toEqual({
      method: "POST",
      path:
        "/assignment-processes/{process_id}/teaching-activities/{activity_id}/retire",
      response: "TeachingActivityPublic"
    });
    // §20.12 withdrew DELETE on both paths; the table must not claim it back.
    expect(
      Object.entries(REPARTO_CONTRACT_OPERATIONS).filter(
        ([name, operation]) =>
          operation.method === "DELETE" &&
          (name.startsWith("groupSubjects.") ||
            name.startsWith("teachingActivities."))
      )
    ).toEqual([]);
    expect(REPARTO_CONTRACT_OPERATIONS["teachingPlans.summary"]).toEqual({
      method: "GET",
      path: "/assignment-processes/{process_id}/teaching-plan/summary",
      response: "PlanBalance"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["teachingPlans.materializeMain"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/teaching-plan/materialize-main",
      response: "MainMaterializationResult"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["teachingPlans.lock"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/teaching-plan/lock",
      response: "TeachingPlanPublic"
    });
    // The way back out of a lock (audit `S2-04`): the plugin declared no
    // unlock at all, so locking was a one-way door on a served endpoint.
    expect(REPARTO_CONTRACT_OPERATIONS["teachingPlans.unlock"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/teaching-plan/unlock",
      response: "TeachingPlanPublic"
    });
    expect(
      REPARTO_CONTRACT_OPERATIONS["teachingPlans.feasibilityWitness"]
    ).toEqual({
      method: "GET",
      path:
        "/assignment-processes/{process_id}/teaching-plan/feasibility/witness",
      response: "FeasibilityWitnessPublic"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["teachingActivities.update"]).toEqual({
      method: "PATCH",
      path:
        "/assignment-processes/{process_id}/teaching-activities/{activity_id}",
      response: "TeachingActivityPublic"
    });
    expect(
      REPARTO_CONTRACT_OPERATIONS["hourRequirements.generationPreview"]
    ).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/requirements/generation-preview",
      response: "RequirementGenerationPreview"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["hourRequirements.generate"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/requirements/generate",
      response: "RequirementGenerationResult"
    });
    expect(
      REPARTO_CONTRACT_OPERATIONS[
        "hourRequirements.reconciliationPreview"
      ]
    ).toEqual({
      method: "POST",
      path:
        "/assignment-processes/{process_id}/requirements/reconciliation-preview",
      response: "RequirementReconciliationPreview"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["hourRequirements.reconcile"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/requirements/reconcile",
      response: "RequirementReconciliationResult"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["assignments.create"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/assignments/",
      response: "AssignmentPublic"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["assignments.undo"]).toEqual({
      method: "POST",
      path: "/assignment-processes/{process_id}/assignments/{assignment_id}/undo",
      response: "AssignmentPublic"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["assignments.reassign"]).toEqual({
      method: "POST",
      path:
        "/assignment-processes/{process_id}/assignments/{assignment_id}/reassign",
      response: "AssignmentPublic"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["assignments.validations"]).toEqual({
      method: "GET",
      path: "/assignment-processes/{process_id}/assignments/validations",
      response: "AssignmentValidationReport"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["processTeachers.extraHours"]).toEqual({
      method: "POST",
      path:
        "/assignment-processes/{process_id}/teachers/{process_teacher_id}/extra-hours",
      response: "ProcessTeacherPublic"
    });
    // No DELETE assignment operation: cancelling is the reason-required undo.
    expect(
      Object.values(REPARTO_CONTRACT_OPERATIONS).some(
        (operation) =>
          operation.method === "DELETE" && operation.path.includes("/assignments/")
      )
    ).toBe(false);
    // The claim-code pair (`W1.4`). The plugin shipped wrappers for both while
    // the table declared neither, so it called two endpoints its own
    // compatibility statement did not say the service serves (`W7.2`). Minting
    // is a department-head act on a named profile; the claim carries the code
    // and nothing else, because the account it binds is read from the token.
    expect(REPARTO_CONTRACT_OPERATIONS["teacherProfiles.issueClaimCode"]).toEqual({
      method: "POST",
      path: "/teacher-profiles/{profile_id}/claim-code",
      response: "TeacherProfileClaimCode"
    });
    expect(REPARTO_CONTRACT_OPERATIONS["teacherProfiles.claim"]).toEqual({
      method: "POST",
      path: "/teacher-profiles/claim",
      response: "TeacherProfilePublic"
    });
    // The table is now every operation the wrappers call, not the subset that
    // happened to be transcribed: 115 wrapper operations plus the SSE stream,
    // which is read by `EventSource` rather than by the fetch client.
    // `npm run verify:contract-operations` is what holds that true in both
    // directions; this length is the reminder that the count is not incidental.
    expect(Object.keys(REPARTO_CONTRACT_OPERATIONS)).toHaveLength(116);
    expect(REPARTO_CONTRACT_OPERATIONS["assignmentProcesses.events"]).toEqual({
      method: "GET",
      path: "/assignment-processes/{process_id}/events",
      response: "text/event-stream"
    });
  });

  // The gate's own subject matter, asserted here so a table edit that breaks it
  // fails in `npm test` too and not only in the CI step that runs the script.
  it("declares every operation the API wrappers call", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const declared = new Set(
      Object.values(REPARTO_CONTRACT_OPERATIONS).map(
        (operation) => `${operation.method} ${operation.path}`
      )
    );
    const undeclared: string[] = [];
    for (const file of readdirSync("src/runtime/api").filter(
      (name) => name.endsWith(".ts") && name !== "index.ts"
    )) {
      const source = readFileSync(`src/runtime/api/${file}`, "utf8");
      // Module-local path helpers (`selectionTurns.ts`), inlined before the
      // parameter holes are rendered.
      const helpers = new Map<string, { parameters: string[]; template: string }>();
      for (const match of source.matchAll(
        /const\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^)]*)\)\s*=>\s*\n?\s*`([^`]*)`/g
      )) {
        helpers.set(match[1], {
          parameters: match[2]
            .split(",")
            .map((parameter) => parameter.trim().split(":")[0].trim())
            .filter(Boolean),
          template: match[3]
        });
      }
      for (const call of source.matchAll(/request<[^>]*>\(\{([\s\S]*?)\}\)/g)) {
        const method = call[1].match(/method:\s*"([A-Z]+)"/)?.[1];
        const expression = call[1].match(/path:\s*([\s\S]*?),\s*(?=[A-Za-z]+\s*:)/)?.[1];
        expect(method).toBeDefined();
        expect(expression).toBeDefined();
        const segments = [...expression!.matchAll(/`([^`]*)`/g)].map((part) => part[1]);
        let path = segments.length
          ? segments.join("")
          : (expression!.match(/^\s*"([^"]*)"\s*$/)?.[1] ?? "");
        path = path.replace(
          /\$\{([A-Za-z_$][\w$]*)\(([^)]*)\)\}/g,
          (whole, name: string, argumentList: string) => {
            const helper = helpers.get(name);
            if (!helper) return whole;
            const args = argumentList.split(",").map((argument) => argument.trim());
            let expanded = helper.template;
            helper.parameters.forEach((parameter, index) => {
              if (args[index] === undefined) return;
              expanded = expanded.split(`\${${parameter}}`).join(`\${${args[index]}}`);
            });
            return expanded;
          }
        );
        path = path.replace(
          /\$\{([A-Za-z_$][\w$]*)\}/g,
          (_, identifier: string) =>
            `{${identifier.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`)}}`
        );
        // A hole that survived both passes is reported, never skipped.
        expect(path).not.toContain("${");
        if (!declared.has(`${method} ${path}`)) undeclared.push(`${method} ${path} (${file})`);
      }
    }
    expect(undeclared).toEqual([]);
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
    expect(injectRoute).toHaveBeenCalledTimes(22);
  });

  it("checks auth order for official starter routes and skips disabled routes", () => {
    const logger = { warn: vi.fn() };
    const injectRoute = vi.fn();
    faReparto({
      mode: "starter",
      routes: { dashboard: false, meeting: "/meeting/[processId]" }
    }).hooks["astro:config:setup"]?.({
      injectRoute,
      injectScript: vi.fn(),
      updateConfig: vi.fn(),
      config: { integrations: [] },
      logger
    } as never);
    expect(logger.warn).toHaveBeenCalledWith(
      "@mano8/astro-auth-m8 is required for official M8 usage"
    );
    expect(injectRoute).toHaveBeenCalledTimes(21);
  });

  it("injects the fa-auth bridge only for the fa-auth-astro provider", () => {
    const faAuthScript = vi.fn();
    faReparto({
      mode: "starter",
      locales: ["en", "es"],
      auth: { provider: "fa-auth-astro", loginPath: "/auth/login" }
    }).hooks["astro:config:setup"]?.({
      injectRoute: vi.fn(),
      injectScript: faAuthScript,
      updateConfig: vi.fn(),
      config: { integrations: [{ name: "@mano8/astro-auth-m8" }] },
      logger: { warn: vi.fn() }
    } as never);
    expect(faAuthScript).toHaveBeenCalledTimes(1);
    const [stage, code] = faAuthScript.mock.calls[0];
    expect(stage).toBe("page");
    expect(code).toContain("@mano8/astro-reparto-m8/fa-auth-bridge");
    expect(code).toContain("\"loginPath\":\"/auth/login\"");
    expect(code).toContain("\"routePrefixes\":[\"/reparto\"]");

    const customScript = vi.fn();
    faReparto({ mode: "starter", auth: { provider: "custom" } }).hooks[
      "astro:config:setup"
    ]?.({
      injectRoute: vi.fn(),
      injectScript: customScript,
      updateConfig: vi.fn(),
      config: { integrations: [] },
      logger: { warn: vi.fn() }
    } as never);
    expect(customScript).not.toHaveBeenCalled();
  });

  it("derives route prefixes for the auth guard", () => {
    expect(repartoRoutePrefixes(buildRepartoRoutes())).toEqual(["/reparto"]);
    expect(
      repartoRoutePrefixes(buildRepartoRoutes({ dashboard: "custom/home" }))
    ).toEqual(expect.arrayContaining(["/custom", "/reparto"]));
    expect(
      repartoRoutePrefixes({ ...buildRepartoRoutes(), dashboard: false } as never)
    ).toContain("/reparto");
    const allDisabled = Object.fromEntries(
      Object.keys(buildRepartoRoutes()).map((key) => [key, false])
    );
    expect(repartoRoutePrefixes(allDisabled as never)).toEqual(["/reparto"]);
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
    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/en/reparto/processes/[processId]/subjects",
      entrypoint: "@mano8/astro-reparto-m8/routes/subjects.astro"
    });
    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/es/reparto/processes/[processId]/audit",
      entrypoint: "@mano8/astro-reparto-m8/routes/audit.astro"
    });
    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/en/reparto/processes/[processId]/planning",
      entrypoint: "@mano8/astro-reparto-m8/routes/planning.astro"
    });
    expect(injectRoute).toHaveBeenCalledWith({
      pattern: "/es/reparto/processes/[processId]/group-subjects",
      entrypoint: "@mano8/astro-reparto-m8/routes/group-subjects.astro"
    });
    expect(injectRoute).toHaveBeenCalledTimes(44);
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

  it("exposes the default Stage 1/2/3 sidebar nav metadata and resolves route hrefs", () => {
    const routes = buildRepartoRoutes();
    const resolved = buildRepartoNav(routes);
    expect(DEFAULT_REPARTO_NAV.configuration.labelKey).toBe("nav.group.configuration");
    expect(
      DEFAULT_REPARTO_NAV.configuration.entries.map((entry) => entry.labelKey)
    ).toEqual([
      // Selecting or creating a process precedes every Stage 1 entry, so the
      // two process surfaces head the group rather than sitting in Stage 3
      // (audit `S2-10`); the rest follow §8.2's step order.
      "nav.item.processes",
      "nav.item.dashboard",
      "nav.item.schools",
      "nav.item.academicYears",
      "nav.item.departments",
      "nav.item.classroomStages",
      "nav.item.teacherRoster",
      "nav.item.allocation",
      "nav.item.processParticipants",
      "nav.item.subjects",
      "nav.item.teachingGroups",
      "nav.item.groupSubjects",
      "nav.item.processSettings"
    ]);
    expect(DEFAULT_REPARTO_NAV.planning.labelKey).toBe("nav.group.planning");
    expect(DEFAULT_REPARTO_NAV.planning.entries.map((entry) => entry.labelKey)).toEqual([
      "nav.item.planning",
      "nav.item.requirements",
      // The planning draft/provisional exports (§7.8) are Stage 2 artifacts, so
      // the export route is reachable from Stage 2 as well as Stage 3.
      "nav.item.planningExports"
    ]);
    expect(DEFAULT_REPARTO_NAV.assignment.labelKey).toBe("nav.group.assignment");
    const schoolsEntry = resolved.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.schools"
    );
    expect(schoolsEntry?.href).toBe("/reparto/setup/schools");
    const dashboardEntry = resolved.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.dashboard"
    );
    expect(dashboardEntry?.href).toBe("/reparto");
    // Neither process surface is left behind in Stage 3.
    expect(
      DEFAULT_REPARTO_NAV.assignment.entries.map((entry) => entry.route)
    ).not.toContain("dashboard");
    expect(
      DEFAULT_REPARTO_NAV.assignment.entries.map((entry) => entry.route)
    ).not.toContain("processList");
    const allocationEntry = resolved.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.allocation"
    );
    expect(allocationEntry?.href).toBe(
      "/reparto/processes/current/allocation"
    );
    const planningExportsEntry = resolved.planning.entries.find(
      (entry) => entry.labelKey === "nav.item.planningExports"
    );
    expect(planningExportsEntry?.href).toBe(
      "/reparto/processes/current/exports"
    );
    const teachingGroupsEntry = resolved.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.teachingGroups"
    );
    expect(teachingGroupsEntry?.href).toBe("/reparto/processes/current/teaching-groups");
    const groupSubjectsEntry = resolved.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.groupSubjects"
    );
    expect(groupSubjectsEntry?.href).toBe(
      "/reparto/processes/current/group-subjects"
    );
    const planningEntry = resolved.planning.entries.find(
      (entry) => entry.labelKey === "nav.item.planning"
    );
    expect(planningEntry?.href).toBe("/reparto/processes/current/planning");
    const auditEntry = resolved.assignment.entries.find(
      (entry) => entry.labelKey === "nav.item.audit"
    );
    expect(auditEntry?.href).toBe("/reparto/processes/current/audit");
    const resolvedMissing = buildRepartoNav(
      buildRepartoRoutes({ dashboard: false })
    );
    const missingDashboard = resolvedMissing.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.dashboard"
    );
    expect(missingDashboard?.href).toBe("#");

    const customNav = buildRepartoNav(buildRepartoRoutes(), {
      configuration: DEFAULT_REPARTO_NAV.configuration,
      planning: DEFAULT_REPARTO_NAV.planning,
      assignment: {
        labelKey: "nav.group.assignment",
        entries: [
          { labelKey: "nav.item.audit" },
          { labelKey: "nav.item.dashboard", route: "dashboard" },
          { labelKey: "nav.item.exports", href: "/custom/exports" }
        ]
      }
    });
    const [audit, dashboard, exportsEntry] = customNav.assignment.entries;
    expect(audit.href).toBe("#");
    expect(dashboard.href).toBe("/reparto");
    expect(exportsEntry.href).toBe("/custom/exports");
  });
});
