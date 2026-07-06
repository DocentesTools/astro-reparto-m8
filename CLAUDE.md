# astro-reparto-m8

> Shared plugin rules live in `/.claude/context/astro-plugin.md` (repo type
> `astro-plugin`). This file lists ONLY what is specific to astro-reparto-m8.

## Role in the fleet

**Optional plugin.** Enabled per deployment (package installed +
`PUBLIC_REPARTO_API_BASE` set). Must degrade safely when absent and must never
force host source edits beyond the documented registration points.

## Backend

Fronts **`reparto-docente-m8`** over its HTTP API. Pinned to the
`reparto-docente-m8@0.1` contract (tested `0.1.0-alpha.0`, range
`>=0.1.0 <0.2.0`; see `repartoDocenteM8` in `package.json`). Published as
`@mano8/astro-reparto-m8` (currently `0.1.0-alpha`).

## Auth coupling

`@mano8/astro-auth-m8` is a **required** peer - the backend accepts fa-auth-m8
tokens. Couple only through `RepartoAuthAdapter` / the `fa-auth-astro` provider;
wire after `faAuth`.

## Modes

- `headless` - schemas, API wrappers, auth adapter, React providers; no pages.
- `starter` - injects the `.astro` routes below (host default for this plugin).

Route set: `dashboard`, `processes`, `meeting`, `my-view` (teacher view),
`shared` (shared screen), `versions`, `exports`, plus the Phase 2 Setup routes
`schools`, `academic-years`, `departments`, `teacher-roster` (under
`/reparto/setup/*`). `DEFAULT_REPARTO_NAV` / `buildRepartoNav` (see
`src/integration.ts`) expose the Setup/Process sidebar nav groups with
`nav.*` i18n label keys for hosts importing the default.

## Repo-specific structure

- `src/runtime/api/**` - assignmentProcesses, assignments, meetingSessions,
  selectionTurns, history, plus the Phase 1 global-entity wrappers: schools,
  academicYears, departments, teacherProfiles.
- `src/runtime/i18n/**` - English-first runtime dictionary (`en`/`fr`/`es`),
  `formatRepartoMessage`, `getRepartoDictionary`, `normalizeRepartoLocale`.
  Mirrors `docs/ui-naming-freeze.md`; tests fail on missing keys, the bare
  `common.teachers` key, or UUIDs leaking into dictionary values.
- `src/runtime/react/**` - `RepartoProvider`, `RepartoQueryProvider`
  (TanStack Query), `LanWorkspace`, `DepartmentHeadWorkspace`, `default-ui/`.
  `default-ui/index.tsx` ships the rebuilt create-process picker: three
  cascading `<select>`s (academic year / school / department) with one-level
  inline create — no raw UUID inputs (empty-DB bootstrap gate, see
  `docs/empty-db-bootstrap-spec.md`).
- `src/runtime/ui/**` - framework-neutral view-state helpers (`lan`, `history`)
  exported via `./ui`.
- `registry/**` - shadcn registry skins generated into `registry/r`, composing
  canonical `@mano8/astro-ui-m8` data-table and state blocks. Phase 1 admin
  skins: `reparto-crud-table`, `reparto-fk-select`, `reparto-delete-confirm`,
  `reparto-school-dialog`, `reparto-academic-year-dialog`,
  `reparto-department-dialog`, `reparto-teacher-roster-dialog`.

## Admin management console (Phase 1+)

Phase 1 of `reparto-admin-crud-plan-2026-07-06` ships the runtime + skins that
unblock process creation from an empty database:

- Runtime: schemas + api wrappers + query keys + CRUD/archive/link-user/delete
  hooks for schools, academic-years, departments, teacher-profiles.
- Skins: generic CRUD table, FK select with one-level inline create,
  relationship-aware delete confirm, and per-entity create/edit dialogs.
- Default-UI: the process picker is now three cascading selects (no UUID
  typing). The empty-DB bootstrap component gate lives at
  `tests/default-ui-bootstrap.test.tsx`; the gate definition is
  `docs/empty-db-bootstrap-spec.md`.

Phase 2 step 1 (global setup CRUD pages + starter routes + plugin nav) is
done 2026-07-06: setup-crud islands for schools / academic-years /
departments / teacher-roster ship in `src/runtime/react/default-ui/setup-crud.tsx`
(edit-only schools/departments; archive-only academic years; hard delete +
link-user for the teacher roster), backed by the four new starter `.astro`
routes and the `DEFAULT_REPARTO_NAV` / `buildRepartoNav` plugin nav snapshot.
Phase 2 step 2 (backend-error mapping + E2E gate) and Phase 3+ (process-scoped
CRUD, dashboards, host wiring) are still TODO.

## Repo-specific rules

- UI delivery is **package exports plus shadcn registry skins** (`/react`, `/ui`,
  `/default-ui`, `registry/r`). React UI stays pure shadcn/Tailwind; table/list
  registry skins consume `@mano8/astro-ui-m8` data-table/state blocks and
  dashboards use shadcn chart patterns.
- Consumers own secrets, env, i18n labels, and final composition.
