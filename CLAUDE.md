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
`shared` (shared screen), `versions`, `exports`.

## Repo-specific structure (beyond the canonical layout)

- `src/runtime/api/**` — assignmentProcesses, assignments, meetingSessions,
  selectionTurns, history.
- `src/runtime/react/**` — `RepartoProvider`, `RepartoQueryProvider`
  (TanStack Query), `LanWorkspace`, `DepartmentHeadWorkspace`, `default-ui/`.
- `src/runtime/ui/**` — framework-neutral view-state helpers (`lan`, `history`)
  exported via `./ui`.

## Repo-specific rules

- UI delivery is **package exports only** (`/react`, `/ui`, `/default-ui`) —
  this repo does **not** ship a shadcn registry today. React UI stays pure
  shadcn/Tailwind; table/list screens follow the `astro-prompt-m8` data-table
  pattern and dashboards use shadcn chart patterns.
- Consumers own secrets, env, i18n labels, and final composition.

## Follow-ups (documented, not yet built)

- No shadcn registry (`registry.json` / `registry/r` / `build-registry.mjs`)
  yet — hosts consume components via package exports. Add one if a host needs
  editable skins, matching the media/prompt pattern.
