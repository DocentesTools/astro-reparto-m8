# astro-reparto-m8

## Layer

Client (optional Astro teaching-assignment plugin).

## Role

Provide the Astro integration and headless reparto client for
`reparto-docente-m8`. The plugin is optional per deployment: it requires an
installed package and configured `PUBLIC_REPARTO_API_BASE`, degrades safely when
absent, and never forces host source edits outside documented registration points.

## Backend and authentication boundary

- Communicate with `reparto-docente-m8` over HTTP only; never import service code.
- Publish `@mano8/astro-reparto-m8` and keep `repartoDocenteM8` package metadata,
  schemas, and compatibility checks aligned with the `reparto-docente-m8@0.1`
  contract, tested at `0.1.0-alpha.0` and supporting `>=0.1.0 <0.2.0`.
- Require `@mano8/astro-auth-m8` as the official M8 auth peer. Couple only through
  `RepartoAuthAdapter` / `createFaAuthAdapter`, wiring it after `faAuth`.
- Model public backend responses only; never expose secret or session fields.
- Export public modules only through explicit `package.json` subpaths.

## Modes, routes, and repository structure

- `headless` provides schemas, API wrappers, auth adapter, and React providers
  without pages. `starter` adds the dashboard, processes, meeting, teacher,
  shared-screen, versions, exports, and setup Astro routes.
- `src/integration.ts` provides `DEFAULT_REPARTO_NAV` / `buildRepartoNav` for
  Setup and Process navigation. Consumers own their final configuration and
  i18n labels.
- `src/runtime/api/**` owns global and process-scoped wrappers plus the single
  backend-error-to-field/form mapping source. `src/runtime/i18n/**` owns the
  English-first `en`/`fr`/`es` dictionary and rejects missing keys, bare
  `common.teachers`, and UUIDs in dictionary values.
- `src/runtime/decimals.ts` owns the canonical two-decimal hour representation:
  the hour Zod schemas (also re-exported from `schemas.ts`), integer-hundredths
  arithmetic, and the hour-input parser that keeps "unset" distinct from zero.
  No hour value may be validated, compared or calculated in binary floating
  point anywhere else in the package.
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
