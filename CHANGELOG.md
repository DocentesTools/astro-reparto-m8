# Changelog

All notable changes to `@mano8/astro-reparto-m8` are documented here.

## [Unreleased]

### Added

- **A teacher claims their own profile with a code** (remediation `W1.4`).
  The roster's *Link user* linked `currentUserId`, so a head pressing it on a
  colleague's row linked **themselves**, and *My view* answered a teacher with
  no linkage by rendering the service's 404 string and stopping there. Neither
  could be fixed by looking a user id up: `fa-auth-m8` owns the accounts
  directory and restricts it to superusers by its own design. So the direction
  is reversed. The roster row of an unlinked profile now offers **Issue claim
  code**, which mints a single-use, expiring code and shows it once in a
  copyable dialog — the service stores only its hash, so a lost code is
  reissued, never read back. *My view* offers **Claim my profile** in place of
  the dead end: a form carrying the code and nothing else, because the account
  it binds is the signed-in one, read from the token by the service. New
  `teacherProfiles.issueClaimCode` / `teacherProfiles.claim` wrappers,
  `useIssueRepartoTeacherProfileClaimCode` / `useClaimRepartoTeacherProfile`
  hooks (the claim invalidates the whole reparto prefix, since it is the moment
  every process-scoped teacher projection starts resolving), and
  `TeacherProfileClaimSchema` / `TeacherProfileClaimCodeSchema`.

- **The turn controls are now gated on an open meeting session**
  (remediation `W1.3`). `buildMeetingControlState` derived every control's
  `disabled` state from `plan_status`, `readiness` and `current_turn` only, so
  with no meeting session open `initialize-turns` rendered enabled — the
  "offered and then refused" behaviour its own docstring exists to prevent. It
  now takes a `sessionOpen` flag and gains a `no_meeting_session` blocked
  reason that closes all five actions when none is open;
  `MeetingControlWorkspace` derives the flag from its `sessionControls`
  session, the same "latest known session" reading the turn hook already uses,
  so the session panel from `W1.2` and the turn row it gates never disagree.
- **The five meeting turn controls are wired to the selection-turn API**
  (remediation `W1.1`). The buttons in `MeetingControlWorkspace` rendered with a
  label, a `data-reparto-action` and a `disabled` flag but **no `onClick`**,
  while `src/runtime/api/selectionTurns.ts` had been complete since the
  three-stage adaptation — so the live meeting could be watched from the
  interface and not run from it. New `useSelectionTurns(processId,
  meetingSessionId)` in `/react` bundles the turn order with one mutation per
  action (`useInitializeRepartoTurns`, `useStartRepartoTurn`,
  `useCompleteRepartoTurn`, `useSkipRepartoTurn`, `useOverrideRepartoTurn`,
  each also exported on its own), and every one invalidates the turn order and
  the assignment projections a turn moves. The workspaces take the bound API as
  an optional prop — `turnControls` on `MeetingControlWorkspace`,
  `choiceControls` on `TeacherLanWorkspace` — so they still render without a
  query client and stay inert rather than crashing when a host has not wired
  them. The starter routes wire both.
- **Every `data-disabled-reason` is now a visible hint.** The turn controls
  carried the reason code as an attribute only, which told the e2e suite why a
  control was shut and told the head nothing; each closed control now states its
  reason beside itself, and `initialize`/`start`/`complete`/`skip`/`override`
  render the service's own refusal instead of failing as a silent no-op.
- **The teacher can pick, take and pass.** The LAN panel's position list was
  read-only, so *Take this position* sat above a selection nothing could make;
  the rows are now selectable (`data-reparto-action="select-slot"`), *Take this
  position* posts the direct choice, and *Pass* skips the caller's **own** turn
  with an audited reason — defaulted rather than required, so passing a turn
  that is genuinely theirs is never blocked by an empty field. Skipping or
  overriding somebody *else's* turn stays closed until the head types one.

### Changed

- **A linked roster row offers *Unlink*, never a link** (remediation `W1.4`).
  *Link user* used to appear on any row not linked to the caller — including a
  colleague's linked row, where pressing it took that colleague's participation
  away. Which control a row offers now follows the row's linkage rather than
  whose it is: linked rows unlink, unlinked rows issue a claim code. *Link to
  me* survives beside the latter, renamed from *Link user* to the only thing it
  has ever done.
- **`is_superuser` no longer grants anything on its own** (remediation `W6.1`).
  `authAdapter.ts` used to read `is_superuser: true` as `superadmin` whatever
  the role said, which gave the department-head surface to a session the service
  refuses outright: `reparto-docente-m8` decides from the role alone
  (`AUTH-INV-01`) and `auth_sdk_m8`'s `UserModel` will not validate a token whose
  `role` and `is_superuser` disagree. The two claims must now agree, and the role
  decides — matching both the service and `@mano8/astro-auth-m8`, which read it
  this way already.
- **The role hierarchy is a verified mirror rather than a second opinion**
  (`RBAC-06`). `authAdapter.ts` now exposes the auth peer's exact surface —
  `ORDERED_ROLES` (highest privilege first), `hasMinimumRole(currentRole,
  requiredRole)`, `privilegeClaimsAreConsistent` and `hasSuperuserPrivileges` —
  and `tests/authorization-mirror.test.ts` asserts agreement with
  `@mano8/astro-auth-m8/authorization` across every role pair and every
  role/flag pair, so it cannot drift. It is a copy and not an import because the
  fleet's `no-cross-plugin-import` gate (`C12`) forbids one business plugin
  importing another at runtime.
- **Every planning panel carries its own `admin` write floor** (`W6.3`, §21.5).
  The six connected panels — main materialization, activity sync, secondary
  activities, plan lock/requirement generation, feasibility diagnostics and
  allocation reconciliation — were exported individually while their gate lived
  in `RepartoPlanningView`, so a host composing its own planning page got an
  ungated mutation surface. Each now renders nothing below the floor, and mounts
  none of its queries there either. `PlanningPanelGate` is exported for a host
  gating a panel of its own.

### Breaking changes

- **`REPARTO_ROLE_ORDER` is removed** from `@mano8/astro-reparto-m8/auth-adapter`
  in favour of `ORDERED_ROLES`, which runs **highest** privilege first (the
  removed constant ran lowest first). `hasMinimumRole` keeps its name but now
  takes two roles, matching the auth peer and the SDK; the session-shaped helper
  it replaced is `sessionHasMinimumRole(user, minimum)`.

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
