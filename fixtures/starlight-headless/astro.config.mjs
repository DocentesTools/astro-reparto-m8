import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import faReparto from "@mano8/astro-reparto-m8";

export default defineConfig({
  site: "https://example.test",
  integrations: [
    react(),
    starlight({
      title: "Reparto headless fixture",
      sidebar: [
        {
          label: "Docs",
          items: [{ label: "Home", link: "/" }]
        }
      ]
    }),
    faReparto({
      mode: "headless",
      apiBase: "/reparto",
      apiPrefix: "/fastapi"
    })
  ]
});
