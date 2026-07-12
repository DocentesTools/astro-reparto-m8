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
  ["requirements.astro", "RepartoHourRequirementsView", "Reparto requirements"],
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
      expect(route).toContain(`<${islandName} client:load`);
      expect(route).toContain(title.startsWith("dict.") ? `title: ${title}` : `title: "${title}"`);
      expect(route).toContain("tableOfContents: false");
      expect(route).toMatch(new RegExp(`<StarlightPage[\\s\\S]*<${islandName}[\\s\\S]*</StarlightPage>`));
    }
  );
});
