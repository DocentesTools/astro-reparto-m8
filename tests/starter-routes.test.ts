import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const routeCases = [
  ["dashboard.astro", "RepartoDashboardView", "Reparto dashboard"],
  ["meeting.astro", "RepartoMeetingView", "Reparto meeting"],
  ["processes.astro", "RepartoProcessesView", "Reparto processes"],
  ["my-view.astro", "RepartoMyView", "My reparto view"],
  ["shared.astro", "RepartoSharedView", "Shared reparto screen"],
  ["versions.astro", "RepartoVersionsView", "Reparto versions"],
  ["exports.astro", "RepartoExportsView", "Reparto exports"],
  ["schools.astro", "RepartoSchoolsView", "Reparto schools"],
  ["academic-years.astro", "RepartoAcademicYearsView", "Reparto academic years"],
  ["departments.astro", "RepartoDepartmentsView", "Reparto departments"],
  ["teacher-roster.astro", "RepartoTeacherRosterView", "Reparto teacher roster"],
  ["subjects.astro", "RepartoSubjectsView", "Reparto subjects"],
  ["classrooms.astro", "RepartoClassroomsView", "Reparto classrooms"],
  [
    "group-subjects.astro",
    "RepartoGroupSubjectsView",
    "Reparto group-subject matrix"
  ],
  ["settings.astro", "RepartoProcessSettingsView", "Reparto process settings"],
  ["allocation.astro", "RepartoAllocationView", "Reparto leadership allocation"],
  ["planning.astro", "RepartoPlanningView", "dict.planning.pageTitle"],
  ["requirements.astro", "RepartoHourRequirementsView", "dict.requirements.pageTitle"],
  ["participants.astro", "RepartoProcessParticipantsView", "Reparto participants"],
  ["assignments.astro", "RepartoAssignmentsView", "Reparto assignments"],
  ["audit.astro", "RepartoAuditView", "dict.audit.pageTitle"]
] as const;

describe("starter route shells", () => {
  it.each(routeCases)(
    "wraps %s in StarlightPage while preserving the package island",
    (fileName, islandName, title) => {
      const route = readFileSync(join(root, "src", "routes", fileName), "utf8");

      expect(route).toContain(
        'import StarlightPage from "@astrojs/starlight/components/StarlightPage.astro";'
      );
      expect(route).toContain(
        'import RepartoRouteLoading from "./_components/RepartoRouteLoading.astro";'
      );
      expect(route).toContain(`<${islandName} client:only="react"`);
      expect(route).toContain('<RepartoRouteLoading fallback slot="fallback"');
      expect(route).toContain(title.startsWith("dict.") ? `title: ${title}` : `title: "${title}"`);
      expect(route).toContain("tableOfContents: false");
      expect(route).toMatch(new RegExp(`<StarlightPage[\\s\\S]*<${islandName}[\\s\\S]*</StarlightPage>`));
    }
  );

  it("shows the canonical loading state before Astro prepares the next route", () => {
    const loader = readFileSync(
      join(root, "src", "routes", "_components", "RepartoRouteLoading.astro"),
      "utf8"
    );

    expect(loader).toContain("RepartoLoadingState");
    expect(loader).toContain("dict.view as typeof dict.view");
    expect(loader).toContain("pageLoading.description");
    expect(loader).toContain('document.addEventListener("astro:before-preparation"');
    expect(loader).toContain('document.addEventListener("astro:page-load"');
    expect(loader).toContain("data-reparto-route-loader-fallback");
    expect(loader).toContain("repartoRouteLoaderClass");
    expect(loader).toContain("repartoRouteTransitionLoaderClass");
    expect(loader).not.toContain("<style>");
  });

  it("keeps every reparto page shell full width", () => {
    const styles = readFileSync(
      join(root, "src", "runtime", "react", "styles.ts"),
      "utf8"
    );
    const directShells = [
      ["default-ui", "classroom-stages.tsx"],
      ["default-ui", "process-crud", "subjects", "index.tsx"],
      ["default-ui", "process-crud", "classrooms", "index.tsx"],
      ["default-ui", "process-crud", "group-subjects", "index.tsx"],
      ["default-ui", "process-crud", "process-settings", "index.tsx"],
      ["default-ui", "process-crud", "allocation", "index.tsx"],
      ["default-ui", "process-crud", "requirements", "index.tsx"],
      ["default-ui", "process-crud", "participants", "index.tsx"],
      ["default-ui", "process-crud", "assignments", "index.tsx"],
      ["default-ui", "process-crud", "audit", "index.tsx"]
    ];

    expect(styles).toContain("w-full max-w-none");
    expect(styles).toContain("w-full! max-w-none! mx-0!");
    expect(styles).not.toContain("max-w-6xl");
    expect(styles).not.toContain("gap-4 px-4 py-4");
    for (const segments of directShells) {
      const source = readFileSync(
        join(root, "src", "runtime", "react", ...segments),
        "utf8"
      );
      expect(source).toContain("w-full max-w-none");
      expect(source).not.toContain("max-w-6xl");
      expect(source).not.toContain("max-w-none p-4");
      expect(source).not.toContain("gap-4 px-4 py-4");
    }
  });
});
