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
      classrooms: "/reparto/processes/[processId]/classrooms",
      classroomStages: "/reparto/setup/classroom-stages",
      groupSubjects: "/reparto/processes/[processId]/group-subjects",
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
      classrooms: "/reparto/processes/[processId]/classrooms",
      classroomStages: "/reparto/setup/classroom-stages",
      groupSubjects: "/reparto/processes/[processId]/group-subjects",
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
    expect(() => assertRepartoCompatibility({ contract_version: "2.0.0" })).not.toThrow();
    expect(() => assertRepartoCompatibility({ service_version: "x" })).toThrow(
      "Unsupported reparto-docente-m8 contract: unknown"
    );
    expect(() => assertRepartoCompatibility({ contract_version: "0.1" })).toThrow(
      "Unsupported reparto-docente-m8 contract: 0.1"
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
    expect(Object.keys(REPARTO_CONTRACT_OPERATIONS)).toHaveLength(66);
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
    expect(injectRoute).toHaveBeenCalledTimes(20);
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
    expect(injectRoute).toHaveBeenCalledTimes(19);
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
    expect(injectRoute).toHaveBeenCalledTimes(40);
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
      "nav.item.schools",
      "nav.item.academicYears",
      "nav.item.departments",
      "nav.item.classroomStages",
      "nav.item.teacherRoster",
      "nav.item.processParticipants",
      "nav.item.subjects",
      "nav.item.classrooms",
      "nav.item.groupSubjects"
    ]);
    expect(DEFAULT_REPARTO_NAV.planning.labelKey).toBe("nav.group.planning");
    expect(DEFAULT_REPARTO_NAV.planning.entries.map((entry) => entry.labelKey)).toEqual([
      "nav.item.planning",
      "nav.item.requirements"
    ]);
    expect(DEFAULT_REPARTO_NAV.assignment.labelKey).toBe("nav.group.assignment");
    const schoolsEntry = resolved.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.schools"
    );
    expect(schoolsEntry?.href).toBe("/reparto/setup/schools");
    const dashboardEntry = resolved.assignment.entries.find(
      (entry) => entry.labelKey === "nav.item.dashboard"
    );
    expect(dashboardEntry?.href).toBe("/reparto");
    const classroomsEntry = resolved.configuration.entries.find(
      (entry) => entry.labelKey === "nav.item.classrooms"
    );
    expect(classroomsEntry?.href).toBe("/reparto/processes/current/classrooms");
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
    const missingDashboard = resolvedMissing.assignment.entries.find(
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
