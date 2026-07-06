import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import faReparto from "@mano8/astro-reparto-m8";

export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: "Reparto starter fixture",
      sidebar: [
        {
          label: "Reparto",
          items: [
            { label: "Dashboard", link: "/reparto" },
            { label: "Processes", link: "/reparto/processes" },
            { label: "Meeting", link: "/reparto/meeting/current" },
            { label: "My view", link: "/reparto/processes/current/my-view" },
            { label: "Shared", link: "/reparto/processes/current/shared" },
            { label: "Versions", link: "/reparto/processes/current/versions" },
            { label: "Exports", link: "/reparto/processes/current/exports" }
          ]
        }
      ]
    }),
    faReparto({
      mode: "starter",
      apiBase: "/reparto",
      apiPrefix: "/fastapi",
      auth: { provider: "none" }
    })
  ]
});
