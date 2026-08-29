# astro-reparto-m8

## Layer

Client (optional Astro teaching-assignment plugin).

## Role

Provide the Astro integration and headless reparto client for
`reparto-docente-m8`. The plugin is optional per deployment: it requires an
installed package and a configured API base (the integration's `apiBase` /
`apiPrefix` options, baked in as `PUBLIC_FA_REPARTO_API_BASE` /
`PUBLIC_FA_REPARTO_API_PREFIX`), degrades safely when absent, and never forces
host source edits outside documented registration points.

## Backend and authentication boundary

- Communicate with `reparto-docente-m8` over HTTP only; never import service code.
- Publish `@mano8/astro-reparto-m8` and keep `repartoDocenteM8` package metadata,
  schemas, and compatibility checks aligned with the `reparto-docente-m8@2.0.0`
  contract, tested at service version `2.0.0` and supporting `>=2.0.0 <3.0.0`.
- Require `@mano8/astro-auth-m8` as the official M8 auth peer. Couple only through
  `RepartoAuthAdapter` / `createFaAuthAdapter`, wiring it after `faAuth`.
- Model public backend responses only; never expose secret or session fields.
- Export public modules only through explicit `package.json` subpaths.

## Modes, routes, and repository structure

- `headless` provides schemas, API wrappers, auth adapter, and React providers
  without pages. `starter` adds the three-stage Astro route map: configuration
  (process list and dashboard, schools, academic years, departments, classroom
  stages, teacher roster, leadership allocation, participants, subjects,
  teaching groups, group-subject matrix, process settings), planning (planning,
  requirements, planning exports) and assignment (assignments, meeting, teacher,
  shared screen, versions, exports, audit).
- `src/integration.ts` provides `DEFAULT_REPARTO_NAV` / `buildRepartoNav`, whose
  three groups are those same stages, composed in §8.2 setup-workflow order
  rather than by strict domain ownership. Consumers own their final configuration
  and i18n labels.
- `docs/host-integration.md` is the consumer-facing integration reference
  (options, route map and role floors, view props, API and hook surface, auth
  assumptions, three-stage walkthrough, starter and headless host examples);
  `fixtures/**` are the build-verified examples behind it. Its §6.1 table names
  every exported component no starter route mounts, and
  `tests/surface-reachability.test.ts` gates it: the test walks the mount graph
  from each `ROUTE_ENTRYPOINTS` page and fails on an exported view or panel that
  is reachable from no route and absent from that table. A component nothing
  mounts is unreachable however well it is tested.
- `src/runtime/api/**` owns global and process-scoped wrappers plus the single
  backend-error-to-field/form mapping source. `src/runtime/i18n/**` owns the
  English-first `en`/`fr`/`es` dictionary and rejects missing keys, bare
  `common.teachers`, and UUIDs in dictionary values.
- `src/runtime/decimals.ts` owns the canonical two-decimal hour representation:
  the hour Zod schemas (also re-exported from `schemas.ts`), integer-hundredths
  arithmetic, and the hour-input parser that keeps "unset" distinct from zero.
  No hour value may be validated, compared or calculated in binary floating
  point anywhere else in the package.
- `src/runtime/routeAccess.ts` owns the one route-to-role map: every route names
  the minimum role that may see it and the minimum role at which its write
  affordances may appear (`admin`, except `teacherView` and `teacherRoster`,
  whose own-data actions are `writer`). The view floor is `reader` on most
  routes — a `USER`-role session has no capability in this application — and
  `admin` on the eight whose data is the service's department-head
  confidentiality tier: `dashboard`, `meeting`, `participants` and `assignments`
  read the live payload (`W5.3`), and `planning`, `audit`, `versions` and
  `exports` read the same tier after the fact (`W7.1`). The floor mirrors the
  service; a `reader` floor on a route the backend answers `403` would render a
  shell around a refused request. `authAdapter.ts` owns the single role
  comparison behind it; no view re-derives its own. `RepartoRouteGuard` applies
  the read floor and `useRepartoCanAct` the write floor, both from the signed-in
  user and never from a caller-supplied prop. The guard states what to show; the
  service remains the authorization boundary.
- `src/runtime/react/**` owns providers and default UI. Its process picker uses
  academic year, school, and department selects with one-level inline creation;
  it never exposes raw UUID inputs. `src/runtime/ui/**` owns framework-neutral
  view-state helpers.
- `registry/**` provides shadcn skins. React UI remains pure shadcn/Tailwind;
  tables consume the `@mano8/astro-ui-m8` data-table/state blocks and dashboards
  use shadcn chart patterns.

## UI and consumer boundaries

- Deliver UI through package exports and shadcn registry skins. FK selects permit
  only one level of inline creation; deeper prerequisites link to their owner.
- The error mapping source supplies `RepartoFieldError`, `RepartoFormError`, and
  `RepartoDisabledReason` with accessible invalid and alert states.
- Consumers own secrets, environment configuration, i18n labels, and final UI
  composition.

## Repository commands

- `npm run build`
- `npm run typecheck`
- `npm test`
- `npm run test:unit`

## Standalone authority

This file, repository documentation, and existing CI are the authoritative local
context. A verified nearest workspace may optionally add launcher-selected
policies and tasks; its absence is a successful standalone condition and does not
make a parent workspace necessary.
