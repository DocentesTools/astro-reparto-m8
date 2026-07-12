# @mano8/astro-reparto-m8

![CI/CD](https://github.com/DocentesTools/astro-reparto-m8/actions/workflows/CI.yaml/badge.svg?branch=main)

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

## Registry skins

React UI should stay pure shadcn/Tailwind. Table and list screens should use the
canonical `@mano8/astro-ui-m8` data-table/state blocks, and dashboard charts
should use shadcn chart patterns.

This package ships shadcn registry items under `registry/r`:

- `reparto-processes-table` - editable process table skin using the canonical
  M8 data table.
- `reparto-state-panel` - loading, empty, error, and unauthorized state adapter
  using the canonical M8 state blocks.
- `reparto-starter-views` - starter copied skins for the dashboard, meeting,
  processes, teacher, shared, versions, and exports islands.

Consumers need shadcn configured with the usual `@/components/ui/*` and
`@/lib/utils` aliases, and should install the registry items from the package:

```sh
npx shadcn add ./node_modules/@mano8/astro-reparto-m8/registry/r/reparto-starter-views.json
```

Regenerate registry output with:

```sh
npm run build:registry
```
