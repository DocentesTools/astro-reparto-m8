# @mano8/astro-reparto-m8

Astro integration and headless client for `reparto-docente-m8`.

The package follows the `astro-prompt-m8` plugin structure: typed Zod schemas,
API wrappers, auth adapter, optional starter routes, and explicit package
exports. Official M8 usage requires `@mano8/astro-auth-m8` because the backend
accepts `fa-auth-m8` tokens.

## Install

```sh
npm i @mano8/astro-reparto-m8 @mano8/astro-auth-m8 zod
```

## Quick start

```ts
import { defineConfig } from "astro/config";
import faAuth from "@mano8/astro-auth-m8";
import faReparto from "@mano8/astro-reparto-m8";

export default defineConfig({
  integrations: [
    faAuth({ apiBase: "/user" }),
    faReparto({ apiBase: "/reparto", mode: "starter" })
  ]
});
```

## UI direction

React UI should stay pure shadcn/Tailwind. Table and list screens should use the
full `astro-prompt-m8` data-table pattern, and dashboard charts should use
shadcn chart patterns.
