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

`@mano8/astro-auth-m8` is a **required** peer — the backend accepts fa-auth-m8
tokens. Couple only through `RepartoAuthAdapter` / the `fa-auth-astro` provider;
wire after `faAuth`.

## Modes

- `headless` — schemas, API wrappers, auth adapter, React providers; no pages.
- `starter` — injects the `.astro` routes below (host default for this plugin).

Route set: `dashboard`, `processes`, `meeting`, `my-view` (teacher view),
`shared` (shared screen), `versions`, `exports`, plus the Setup routes
`schools`, `academic-years`, `departments`, `teacher-roster` under
`/reparto/setup/*`. `DEFAULT_REPARTO_NAV` / `buildRepartoNav` (see
`src/integration.ts`) expose the Setup/Process sidebar nav groups with `nav.*`
i18n label keys for hosts importing the default.

## Repo-specific structure (beyond the canonical layout)

- `src/runtime/api/**` — global-entity wrappers (schools, academicYears,
  departments, teacherProfiles) and process-scoped wrappers
  (assignmentProcesses, assignments, subjects, teachingGroups, hourRequirements,
  processTeachers, meetingSessions, selectionTurns, history, auditEvents
  [read-only]). `errorMapping.ts` (`mapRepartoError` / `findFieldError` /
  `describeErrorKey`) turns `RepartoApiError` / `RepartoUnauthenticatedError` /
  network failures into per-field + form-level errors; re-exported via `./api`
  and `./error-mapping`.
- `src/runtime/i18n/**` — English-first runtime dictionary (`en`/`fr`/`es`),
  `formatRepartoMessage`, `getRepartoDictionary`, `normalizeRepartoLocale`.
  Mirrors `docs/ui-naming-freeze.md`; tests fail on missing keys, the bare
  `common.teachers` key, or UUIDs leaking into dictionary values.
- `src/runtime/react/**` — `RepartoProvider`, `RepartoQueryProvider` (TanStack
  Query), `LanWorkspace`, `DepartmentHeadWorkspace`, and `default-ui/`.
  `default-ui/` ships the cascading create-process picker (academic year /
  school / department selects with one-level inline create — no raw UUID inputs;
  see `docs/empty-db-bootstrap-spec.md`), the Setup CRUD islands
  (`setup-crud.tsx`), and the process-scoped CRUD islands split by entity and
  operation under `default-ui/process-crud/**`.
- `src/runtime/ui/**` — framework-neutral view-state helpers (`lan`, `history`)
  exported via `./ui`.
- `registry/**` — shadcn registry skins generated into `registry/r`, composing
  canonical `@mano8/astro-ui-m8` data-table and state blocks (generic CRUD
  table, FK select with inline create, relationship-aware delete confirm,
  per-entity create/edit dialogs).

## Repo-specific rules

- UI delivery is **package exports plus shadcn registry skins** (`/react`, `/ui`,
  `/default-ui`, `registry/r`). React UI stays pure shadcn/Tailwind; table/list
  registry skins consume `@mano8/astro-ui-m8` data-table/state blocks and
  dashboards use shadcn chart patterns.
- FK selects offer one-level inline create only; deeper prerequisites link out to
  the owning entity rather than nesting dialogs.
- `errorMapping.ts` is the single source for backend-error → field/form mapping;
  Setup and process-scoped islands surface it via `RepartoFieldError` /
  `RepartoFormError` / `RepartoDisabledReason` with `aria-invalid` +
  `role="alert"`.
- Consumers own secrets, env, i18n labels, and final composition.
