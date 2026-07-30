# @mano8/astro-reparto-m8

![CI/CD](https://github.com/DocentesTools/astro-reparto-m8/actions/workflows/CI.yaml/badge.svg?branch=main)

Astro integration and headless client for `reparto-docente-m8`.

## Classroom stages and bulk classrooms

The plugin exposes global classroom-stage schemas, API helpers, React Query
hooks, and the `/reparto/setup/classroom-stages` starter route. Stage reads are
available to authenticated users; mutation controls and the management route
use the auth adapter's existing `admin`/`superadmin` capability while the
backend remains authoritative.

Classroom forms submit `classroom_stage_id`, constrain grade to the selected
stage, and generate `{grade}° {stage.label} {group_code}` until the label is
manually changed. The bulk dialog previews an inclusive A-Z range and submits
one atomic request to the process-scoped groups endpoint. Mutation feedback uses
the canonical shadcn Sonner toast contract from `astro-ui-m8`.

## Decimal hours

Every weekly hour value in the backend contract is a two-decimal quantity
exchanged as a canonical string such as `"2.50"`, and hour differences are
signed (`"-4.00"`). `@mano8/astro-reparto-m8/decimals` owns that representation:

- `HoursSchema` / `SignedHoursSchema` read what the backend sends — a canonical
  string on computed schemas, a JSON number on entity schemas whose column sweep
  is still open — and normalize both to a canonical string. Compose with
  `.nullable()` for an hour column whose `NULL` means "inherit the default".
- `CanonicalHoursSchema` / `CanonicalSignedHoursSchema` validate the canonical
  string form strictly, for payloads the UI builds.
- `addHours`, `subtractHours`, `sumHours`, `multiplyHours`, `compareHours` and
  `hoursEqual` run every calculation through integer hundredths, so no balance,
  target or difference is ever computed in binary floating point.
- `parseHoursField` / `formatHoursField` back hour inputs, keeping an empty
  field ("inherit the default") distinct from a typed `0`.

The schemas are also re-exported from `@mano8/astro-reparto-m8/schemas`.

## Allocation revisions

School leadership communicates a weekly group-hour allocation to the department,
and may revise it at any time. The value is never overwritten: every figure is an
immutable revision, exactly one of which is current. `allocationRevisions.list`
returns the history oldest-first, `allocationRevisions.current` returns the
single non-superseded revision (**404** while no allocation has been communicated
yet — a normal state for a new process), and `allocationRevisions.create` records
a new one, superseding the previous revision and emitting an audit event. There
is no update or delete wrapper, by contract.

`reason` is mandatory on create, `allocated_group_weekly_hours` must be greater
than zero, and the create schema normalizes it to the canonical `"120.00"` string
(rejecting a third decimal place rather than rounding it). A `final` or
`archived` process must be reopened before its allocation can change.

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
