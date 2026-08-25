# Changelog

All notable changes to `@mano8/astro-reparto-m8` are documented here.

## [Unreleased]

## [2.0.0] - 2026-08-25

`2.0.0` is a major release. Read the **Breaking changes** section before
upgrading from `1.0.0` — the backend contract, the UI vocabulary and the auth
peer all move.

### Breaking changes

- **The backend contract is now `reparto-docente-m8@2.0.0`.** The compatibility
  gate rejects any service answering an older contract, so a host must upgrade
  its `reparto-docente-m8` deployment to `2.0.0` **before** upgrading this
  plugin. The check fails closed at preflight rather than letting a page 404 at
  runtime, but the plugin is unusable against a `1.x` service.
- **The Classroom UI vocabulary is renamed to "teaching group"** (`S2-11`).
  Exported types, props, hook names and translation keys that spoke of a
  classroom now speak of a teaching group. A host that imported the old names
  will not compile until it renames them.
- **The required auth peer is `@mano8/astro-auth-m8` `^2.2.0`.** The previous
  `^2.0.0`/`^2.1.0` ranges are no longer accepted, in both `peerDependencies`
  and `devDependencies`.
- **Obsolete assignment inputs were removed from the registry** (`§13.2`), and
  the reparto auth runtime imports were dropped in favour of the auth peer's
  adapter. Skins installed from the `1.0.0` registry must be reinstalled.
- **Five new process-scoped routes are generated** —
  `/reparto/processes/[processId]/{allocation,teaching-groups,group-subjects,settings,planning}`.
  A host that hard-codes its own route map must add them; `fa-ui-m8` already
  expects them and carries a self-retiring allowance until this release lands.

### Added

- **The three-stage workflow** (`13.2a`): teaching-plan creation and its unlock
  path, the group-subject matrix on its own route, the process settings form and
  reopen control, and a setup checklist rewritten to the three stages.
- **Role-gated routing** (`§21.8`). Every `§8.1` route is gated by its required
  minimum role, view mode is derived from the signed-in role, and per-role view
  visibility is proven per record and on the wire.
- **Feasibility and planning diagnostics** (`§20.20`): the infeasibility
  diagnostics panel, the out-of-sync activity panel with feasibility SSE,
  witness-safe assignment choice UI, and feasibility surfaced on the dashboard
  as its own invariant.
- **Every React island root is wrapped in an error boundary** (`A-C3`). A throw
  inside a view renders the canonical `astro-ui-m8` error state instead of
  tearing the island down and leaving a blank region on the host page.
- **Dev-only `/_preview` gallery** (`A-C2`). `npm run preview:dev` mounts every
  shipped island against an in-memory stand-in for `reparto-docente-m8`; only
  `fetch` is replaced, so the views, hooks, API wrappers and Zod schemas are the
  shipped ones. Not part of the published tarball.
- Planning artifacts separated from the final export (`§13.2`), the `§10.3`
  comparison dimensions, the meeting control room (closing `RBAC-07`), and
  multi-assignment undo under one shared reason.

### Changed

- **`@mano8/astro-ui-m8` raised to `^1.5.0`** — the version this release was
  actually built and gated against, rather than a wider inherited range.
- **A sibling service's `/meta` is rejected by contract name** (`A36`), so a
  `prompt-engine-m8` or `media-service-m8` deployment answering on the reparto
  base URL is refused instead of being read as a version mismatch.
- **The nested `/meta` contract shape is read correctly** (`A35`). The gate
  accepts the `{ name, version, range }` object `reparto-docente-m8` actually
  serves, alongside the legacy flat string.
- The teacher choice is gated on the session's selection mode (`13.6`), and a
  cold-start session is recovered rather than waited on forever.
- Activities and cells are retired rather than deleted (`13.2a` `S2-08`/`S2-09`).
- CI adopts the ESLint 10 flat config, typechecks the registry skins, normalizes
  CRLF when inlining, and runs the fleet alignment gates (`C12`).
