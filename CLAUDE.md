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
  academicYears, departments, teacherProfiles; and the Phase 3 step 1
  process-scoped wrappers: subjects, teachingGroups, hourRequirements,
  processTeachers, auditEvents (read-only). `assignments` gained
  list/get/create/update/remove alongside its existing `directChoice`.
  Phase 2 step 2 ships `errorMapping.ts`
  (`mapRepartoError`/`findFieldError`/`describeErrorKey`) that turns
  `RepartoApiError` / `RepartoUnauthenticatedError` / network failures into
  per-field + form-level mapped errors, re-exported via `./api` and
  `./error-mapping`.
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
Phase 2 step 2 (backend-error mapping + disabled-reason surfacing + i18n
labels + component tests) is also done 2026-07-06: `runtime/errorMapping.ts`
turns `RepartoApiError` (and the unauth/network paths) into per-field +
form-level mapped errors; the four Setup islands surface them via
`RepartoFieldError` / `RepartoFormError` / `RepartoDisabledReason` (in
`runtime/react/default-ui/feedback.tsx`) with `aria-invalid` + `role="alert"`
on the affected inputs and always-visible `data-reparto-disabled-reason`
spans. The i18n dict gains `error.invalidDate` and `error.conflict` for
en/fr/es. 184/184 tests green; runtime coverage 100/100/100/100.
Phase 3+ (process-scoped CRUD, dashboards, host wiring) and the
`fa-ui-m8` Playwright E2E gate for empty-DB bootstrap are still TODO.

Phase 3 step 1 (runtime for process-scoped entities) is done 2026-07-06:
`src/runtime/schemas.ts` gains `Subject*`, `TeachingGroup*`,
`HourRequirement*` (+ `RequirementTypeSchema`), `ProcessTeacher*` (+
`ProcessTeacherStatusSchema`), `AuditEvent*`, plus standalone
`AssignmentTypeSchema`/`AssignmentSourceSchema`/`AssignmentStatusSchema`
enums (reused by `AssignmentCreate`/`AssignmentUpdate`/`AssignmentDirectChoice`)
and a new `AssignmentUpdateSchema` + `AssignmentsPublicSchema`. Five new
api wrappers (`subjects`, `teachingGroups`, `hourRequirements`,
`processTeachers`, `auditEvents` [list-only]) and `assignments` list/get/
create/update/remove join `api/index.ts`; `repartoKeys` gains
`subjects`/`teachingGroups`/`hourRequirements`/`processTeachers`/
`assignments`/`auditEvents` (process-scoped under `repartoKeys.process`)
and `react/hooks.tsx` ships the matching list + CRUD + direct-choice hooks
(exported through `react/index.ts`). 199/199 tests green; runtime coverage
100/100/100/100; `typecheck`, `build`, `build:registry`,
`verify:starter-routes`, and `pack --dry-run` all green. Phase 3 step 2
(CRUD pages + FK-selects + relationship-aware delete + error-mapping field
aliases for these entities) and the host Playwright gate remain TODO.

## Repo-specific rules

- UI delivery is **package exports plus shadcn registry skins** (`/react`, `/ui`,
  `/default-ui`, `registry/r`). React UI stays pure shadcn/Tailwind; table/list
  registry skins consume `@mano8/astro-ui-m8` data-table/state blocks and
  dashboards use shadcn chart patterns.
- Consumers own secrets, env, i18n labels, and final composition.
