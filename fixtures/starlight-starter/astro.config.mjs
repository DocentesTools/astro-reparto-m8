import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import faReparto from "@mano8/astro-reparto-m8";

// Starter host example: the integration owns every route, and the sidebar is
// grouped by the three stages, in the order the service enforces them.
export default defineConfig({
  site: "https://example.test",
  integrations: [
    react(),
    starlight({
      title: "Reparto starter fixture",
      sidebar: [
        {
          label: "Configuration",
          items: [
            { label: "Schools", link: "/reparto/setup/schools" },
            { label: "Academic years", link: "/reparto/setup/academic-years" },
            { label: "Departments", link: "/reparto/setup/departments" },
            { label: "Classroom stages", link: "/reparto/setup/classroom-stages" },
            { label: "Teacher roster", link: "/reparto/setup/teacher-roster" },
            { label: "Participants", link: "/reparto/processes/current/participants" },
            { label: "Subjects", link: "/reparto/processes/current/subjects" },
            { label: "Teaching groups", link: "/reparto/processes/current/teaching-groups" }
          ]
        },
        {
          label: "Planning",
          items: [
            { label: "Planning", link: "/reparto/processes/current/planning" },
            { label: "Requirements", link: "/reparto/processes/current/requirements" }
          ]
        },
        {
          label: "Assignment",
          items: [
            { label: "Dashboard", link: "/reparto" },
            { label: "Processes", link: "/reparto/processes" },
            { label: "Assignments", link: "/reparto/processes/current/assignments" },
            { label: "Meeting", link: "/reparto/meeting/current" },
            { label: "My view", link: "/reparto/processes/current/my-view" },
            { label: "Shared", link: "/reparto/processes/current/shared" },
            { label: "Versions", link: "/reparto/processes/current/versions" },
            { label: "Exports", link: "/reparto/processes/current/exports" },
            { label: "Audit", link: "/reparto/processes/current/audit" }
          ]
        }
      ]
    }),
    faReparto({
      mode: "starter",
      apiBase: "/reparto",
      apiPrefix: "/fastapi",
      auth: { provider: "custom" }
    })
  ]
});
