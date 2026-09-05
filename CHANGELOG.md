# Changelog

All notable changes to `@mano8/astro-reparto-m8` are documented here.

## [Unreleased]

### Changed

- **The setup checklist is a button on every step, not a preamble.** The
  fifteen-step checklist used to be printed at the top of the process picker —
  which is what every process-scoped step page falls back to while no process is
  selected — so an operator opening *Subjects* met the state of the whole year
  above the one form they came for. It now opens from a **Setup checklist**
  button in the `RepartoRouteGuard` toolbar, beside the `?` help, on every route
  but the dashboard; the dashboard keeps it laid out in full, because the state
  of the process already *is* its subject, and is therefore the one route with
  no button.

  The panel fetches nothing until it is opened: its queries live in a component
  that is mounted only while the dialog is, so a reader who never presses the
  button pays nothing, and the reads it then makes are the same list reads the
  Stage 1 routes make. Which reads those are depends on the answer it needs —
  with a process selected it reads that process's summary and Stage 1 counts and
  skips the school/year/department lists entirely, because a process is already
  proof all three exist.

  The toggle is deliberately not a `data-reparto-action`: that attribute marks
  the write affordances the role floors withhold, and a read-only summary of what
  is done is offered to every role that may see the route at all.

- **Every checklist line links to the page its step is done on.** The checklist
  answers *what is left*; a reader told they still owe the group-subject matrix
  should not then have to find it in the menu. `SETUP_CHECKLIST_STEP_ROUTE`
  (`src/runtime/ui/setupChecklist.ts`) names the one route per step, stated once
  beside the derivation it belongs to. Process-scoped links carry the reader's
  own process id and fall back to the route map's `current` placeholder when
  none is selected.

  This replaces the picker's three inline-create buttons on the checklist, which
  duplicated the *Create new* option the picker's own FK selects already offer.

- **The no-process gate selects; it no longer creates.** Every process-scoped
  route falls back to `WithSelectedProcess` when no process is remembered, and
  that fallback was the whole `ProcessPicker` — a three-select create form. So
  `/reparto` answered *Dashboard* with *fill in this form*, on a cold browser,
  and the dashboard never drew. The gate is now a real empty state: a selector
  over the existing processes, or a statement that there are none, plus a link to
  the `processList` route. Creating an assignment process stays where it belongs
  — that route already opens the same three-select form from its own Create
  button, with one level of inline creation and never a raw UUID. The link is
  withheld below the `processList` act floor, so a reader is told what is missing
  rather than handed an affordance that would refuse them.

- **The dashboard reads its checklist at a dashboard's altitude.** Fifteen
  bordered rows beside four panels of metrics was a worklist where a report
  belonged. `SetupChecklistSummary` opens the panel with a progress bar, the
  three per-stage counts, and the first genuinely outstanding step named as a
  link — and the rows still follow it, because the dashboard is the one surface
  that carries the checklist in full. Steps the surface could not check are
  reported beside the count and never folded into it: `11/15` with two unknown is
  a different statement from `11/15` with none. An `unknown` step is never
  offered as the next action, because nobody looked at it.

- **The dashboard and the process list are `Overview`, not `Stage 1`.** The `?`
  panel's first line used to read *Stage 1 · Configuration* on both, telling a
  reader they were standing on a workflow step when nothing is performed on
  either page — they report on the workflow. `REPARTO_STEP_STAGE` gains a fourth
  value, `overview`, resolved through the new `repartoStageLabel` against
  `help.overview` rather than a `nav.group.*` label it would have had to invent.
  The sidebar still groups both under Stage 1, and rightly — nothing else opens
  until a process is selected — but that is a menu-ordering fact and it stops at
  the menu.

### Added

- **`routes` on the runtime config**, so a link built inside a view points at
  this host's URLs rather than the package's defaults. The integration bakes its
  resolved route map in as `import.meta.env.PUBLIC_FA_REPARTO_ROUTES` and the
  starter routes pass it through with `apiBase` and `docsBase`; a headless host
  passes the same fragments it gave `faReparto`, and a partial map is completed
  from the defaults rather than taken half-filled. `repartoRouteHref`
  (`src/runtime/routes.ts`) resolves one address from it — filling the
  `[processId]` placeholder, adding the locale segment only when the reader's
  path already carries one, and returning `null` for a route the host disabled
  so a dropped route yields plain text rather than a dead link.

- **`flow.bootstrap.openChecklist` / `closeChecklist` / `checking` /
  `progress` / `unknownCount` / `next` / `allDone`**, **`picker.gateTitle` /
  `gateHint` / `gateEmptyHint` / `gateCreate`**, and **`help.overview`** in the
  `en`/`fr`/`es` dictionaries, frozen in `docs/ui-naming-freeze.md` §8 alongside
  the new `data-reparto-checklist-toggle`, `-link`, `-summary`, `-stage` and
  `-next` slots.

## [2.1.0] - 2026-09-04

A guidance release. Every step now explains itself, and the auth adapter is
shared across duplicate module instances so a local dev server stops refusing
signed-in administrators.

### Added

- **A `?` help panel on every step.** `RepartoRouteGuard` renders a *What do I
  do here?* button above every route it admits, opening a collapsed panel that
  answers the three questions a first-time reader actually has, in order: what
  this page is, why it matters, and how to work it as a numbered list. The copy
  is written for somebody who has never used the application, and it is the same
  material as the host-side Reparto Docente guide, which each panel links to at
  its foot.

  It sits on the guard rather than in twenty-two views because the guard is the
  one place every route passes through, exactly once, with its own name in hand:
  a step cannot be added without a guard, so a step cannot be added without its
  help. It is withheld below the route's `view` floor and while the session is
  unresolved — a session that may not see a route is not told how to work it —
  and it fetches nothing, so the words are present at the first paint whatever
  the network is doing.

  The panel's heading and stage label are read from `nav.item.*` and
  `nav.group.*` rather than restated, so the help and the menu cannot drift
  apart. `tests/step-help.test.tsx` asserts all twenty-two steps carry real
  guidance in all three locales, that the panel renders on every route a viewer
  may open, and that it is absent on the two cases where it must be.

- **`help.*` in the `en`/`fr`/`es` dictionaries** — the panel's own labels and
  `help.step.<route>` for each of the twenty-two steps, fully translated rather
  than an English string in three files. The existing key-parity test covers the
  new subtree, so a step added in one language and not the others fails the
  build.

- **`docs.base` integration option**, baked in as
  `PUBLIC_FA_REPARTO_DOCS_BASE` and carried on the runtime config as `docsBase`
  (default `/docs/reparto`). It is used only for the *Read the full guide* link;
  a host that publishes no guide sets it to `""` and the link is dropped rather
  than pointing at a page that is not there. The locale segment is taken from
  the path the reader is already on, the same test `faAuthBridge` applies to the
  login path, so a localized host needs no separate setting.

- **`@mano8/astro-reparto-m8/step-help`** — `repartoStepGuidance(dict, route)`
  returns one step's resolved title, stage, copy and guide link as plain data,
  so a headless host composing its own views can render the same guidance
  without this package's panel.

### Fixed

- **A signed-in administrator was refused every reparto route under
  `astro dev`,** client-side, before a single request reached the service, and
  the route painted its read-only reader notice. The production bundle was
  unaffected, which is why this only ever appeared locally.

  Astro serves a `client:only` island from the package's raw path while a bare
  specifier — the integration's injected bridge script, or a host importing
  `@mano8/astro-reparto-m8/react` — is served from Vite's optimized dependency
  cache. Both graphs load `authAdapter.js`, and they load *different copies of
  it*, each evaluating its own `let activeAdapter`. So
  `installRepartoFaAuthBridge` registered the fa-auth session on one copy while
  `useRepartoCurrentUser` read the other, still the anonymous in-memory adapter,
  and every role gate failed closed as designed on a session it could not see.

  `src/runtime/moduleState.ts` now holds the package's mutable runtime state in
  one slot per realm, keyed by `Symbol.for`, so every copy of a module reads and
  writes the same storage. Four values move into it: the auth adapter and the
  runtime config, which one module registers and another reads back; the
  bridge's install guard, so a second copy cannot install an adapter and
  redirect again; and the role hook's cold-start recovery, whose whole purpose
  is that concurrent mounts refresh once. The public surface is unchanged.

- **`configureReparto` no longer erases a setting when handed `undefined`.** A
  starter route passes `import.meta.env.PUBLIC_FA_REPARTO_*` straight through,
  and a host that has not defined one of those would otherwise spread
  `undefined` over a working default and take the setting away.

## [2.0.0] - 2026-08-29

`2.0.0` is a major release. Read the **Breaking changes** section before
upgrading from the published `1.0.0` — the backend contract, the UI vocabulary,
the auth peer and eight route view floors all move.

It was first prepared on 2026-08-25 and never published, so the remediation
batch it now also carries rides the same unreleased number rather than taking
one of its own. It releases together with `reparto-docente-m8@2.0.0`: this
client cannot drive an older service, and a `1.0.0` client cannot drive the new
service's administrator read floors.

### Breaking changes

- **Four routes move to an administrator view floor** (remediation `W5.3`).
  `REPARTO_ROUTE_ACCESS` gives `dashboard`, `meeting`, `participants` and
  `assignments` `view: "admin"`; every other route keeps `view: "reader"`. The
  four are the ones built on `GET …/dashboard` or `GET …/teachers`, and
  `reparto-docente-m8` now serves both to an administrator only: they carry the
  confidentiality tier §20.25 calls *department head* — every participant's
  target, assigned and remaining hours, the validation findings that name them,
  and the head's written extra-hours reason — which the SSE teacher tier and the
  shared screen have always redacted. Leaving the floor at `reader` would render
  a shell around a request the service refuses, which is the same mistake as
  offering an affordance the backend would reject, one layer up.

  A `READER` or `WRITER` session now meets `RepartoRouteGuard`'s refusal on
  those four instead of a read-only page. **The teacher's own route is
  untouched:** *My view* reads `…/lan/me` and the projected screen reads
  `…/summary`, both still at the reader floor, so a participant keeps their own
  five figures, the free positions, whose turn it is and the aggregate balances.
  A host that overrode `REPARTO_ROUTE_ACCESS`, or that mounts these views behind
  its own gate, should re-check that gate against the service's floor.

- **Four more routes move to an administrator view floor** (remediation
  `W7.1`). `REPARTO_ROUTE_ACCESS` gives `planning`, `audit`, `versions` and
  `exports` `view: "admin"`, joining `W5.3`'s four. Where those four read the
  *live* department-head payload, these four read the same tier **after the
  fact**, and `reparto-docente-m8` now serves all of it to an administrator
  only:

  | Route | Read it is built on |
  | --- | --- |
  | `planning` | `GET …/teaching-plan/validations` — since `W5.1` every finding names the participant it is about and quotes their hours |
  | `audit` | `GET …/audit-events/` — the extra-hours event carries the head's written reason beside that participant's hours |
  | `versions` | `GET …/versions`, `GET …/compare-previous-year` and `GET …/versions/{left}/compare/{right}` — whole-process snapshots |
  | `exports` | `GET …/exports` — the inventory of artefacts built from all of it |

  A `READER` or `WRITER` session now meets `RepartoRouteGuard`'s refusal on
  these four instead of a read-only page. **A participant keeps their own
  view:** *My view* reads `…/lan/me` and the projected screen reads `…/summary`,
  both still at the reader floor — and `…/summary` is where the nameless
  readiness counts live, which is the question a participant actually asked of
  a validation report. A host that overrode `REPARTO_ROUTE_ACCESS`, or that
  mounts these views behind its own gate, should re-check that gate against the
  service's floor.

  `docs/host-integration.md`'s route table now prints the `view` floor
  correctly for all eight; it had still shown `reader` for `W5.3`'s four.

- **`REPARTO_ROLE_ORDER` is removed** from `@mano8/astro-reparto-m8/auth-adapter`
  in favour of `ORDERED_ROLES`, which runs **highest** privilege first (the
  removed constant ran lowest first). `hasMinimumRole` keeps its name but now
  takes two roles, matching the auth peer and the SDK; the session-shaped helper
  it replaced is `sessionHasMinimumRole(user, minimum)`.
- **The backend contract is now `reparto-docente-m8@2.0.0`.** The compatibility
  gate rejects any service answering an older contract, so a host must upgrade
  its `reparto-docente-m8` deployment to `2.0.0` **before** upgrading this
  plugin. The check fails closed at preflight rather than letting a page 404 at
  runtime, but the plugin is unusable against a `1.x` service.
- **The Classroom UI vocabulary is renamed to "teaching group"** (`S2-11`).
  Exported types, props, hook names and translation keys that spoke of a
  classroom now speak of a teaching group. A host that imported the old names
  will not compile until it renames them.
- **The required auth peer is `@mano8/astro-auth-m8` `^2.4.0`.** The previous
  `^2.0.0`/`^2.1.0`/`^2.2.0`/`^2.3.0` ranges are no longer accepted, in both
  `peerDependencies` and `devDependencies`. Two reasons stack and the floor is
  the higher. `2.3.0` is the release that coordinates the two token-refresh
  paths behind one single-flight guard; below it, a page mounting both paths
  against one expired token can issue two rotations, which `fa-auth-m8` reads as
  reuse and answers by revoking every session for the account. `2.4.0` is the
  release in which `@mano8/astro-auth-m8/authorization` becomes a **supported**
  import surface rather than an internal module this package happens to be able
  to reach. That one is load-bearing here and not merely prudent: `authAdapter.ts`
  re-exports `ORDERED_ROLES`, `hasMinimumRole`, `privilegeClaimsAreConsistent`
  and `hasSuperuserPrivileges` from that specifier, and
  `tests/authorization-mirror.test.ts` asserts they are the peer's own bindings
  by identity — so below `2.4.0` this package would be depending on a promise
  the peer had not yet made.
- **Obsolete assignment inputs were removed from the registry** (`§13.2`), and
  the reparto auth runtime imports were dropped in favour of the auth peer's
  adapter. Skins installed from the `1.0.0` registry must be reinstalled.
- **Five new process-scoped routes are generated** —
  `/reparto/processes/[processId]/{allocation,teaching-groups,group-subjects,settings,planning}`.
  A host that hard-codes its own route map must add them; `fa-ui-m8` already
  expects them and carries a self-retiring allowance until this release lands.

### Added

- **The contract table declares every operation the wrappers call, and a gate
  holds it there** (remediation `W7.2`). `REPARTO_CONTRACT_OPERATIONS` declared
  67 operations while `src/runtime/api/` called 115. The two teacher-profile
  claim operations `W1.4` added were the visible half — the plugin shipped
  `issueClaimCode` and `claim` wrappers against endpoints its own compatibility
  statement did not say the service serves — but whole resource groups had
  never been declared at all: `schools`, `academicYears`, `departments`,
  `classroomStages`, `teacherProfiles`, `subjects`, `teachingGroups` and
  `auditEvents`, plus the participant roster, the two feasibility reads, the
  matrix sync pair and the requirement list/get pair. The table is now all 115
  wrapper operations plus the SSE stream. **Existing entries keep their names,
  methods and paths**, so a host reading the table by key is unaffected; this
  is additive.

  `npm run verify:contract-operations` (new, and wired into CI) checks both
  directions: every declared operation appears in the service's published
  surface, and every `request({ method, path })` under `src/runtime/api/`
  appears in the table. The second direction is the one that had never been
  checked by anything, and it is the one the claim pair failed. The gate reads
  `contract/served-api-surface.json`, a tracked copy of
  `reparto-docente-m8/docs/served-api-surface.json` refreshed by
  `npm run refresh:served-surface` — vendored rather than read across
  repositories so the gate runs from a bare `npm ci` of this package alone,
  and refreshed by a deliberate act with a reviewable diff, the same rule the
  service applies to producing the artifact.

  The `response` column names the **service's** response model, not this
  package's local type for it. The two differ on the three feasibility reads,
  where the client models `FeasibilityWitnessPublic` as
  `FeasibilityWitnessReport`; the existing witness entry already had this
  right, and the two newly declared reads follow it with
  `FeasibilityEvaluationPublic` and `FeasibilityDiagnosticsPublic`. The gate
  compares method and path only — the published surface artifact records no
  response models, so that column stays reviewed rather than checked.

- **The shared screen and the control room show balanced/pending/overloaded
  participant counts** (remediation `W1.6`). `ProcessSummary` gains
  `balanced_participant_count`, `pending_participant_count` and
  `overloaded_participant_count`, computed by the service from the same
  per-participant `state` the head's dashboard already reads — nameless
  aggregates, so they are safe on the projected `SharedScreenWorkspace`, which
  now renders all three in a new "Participants" panel. `MeetingControlWorkspace`
  drops its local `participants.filter((p) => p.is_overloaded).length` in favor
  of the shared `overloaded_participant_count` field, so the count can no longer
  disagree with the service's own arithmetic over the same rows.
  `summarizeProcessDashboard` computes the three counts from the dashboard's
  own participant rows for a view that already holds a `ProcessDashboard` and
  must not make a second round trip to `/summary`.

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
- **The role hierarchy is imported, not re-implemented** (`RBAC-06`,
  remediation `W7.7`). `authAdapter.ts` re-exports `ORDERED_ROLES`,
  `hasMinimumRole`, `privilegeClaimsAreConsistent` and `hasSuperuserPrivileges`
  straight from `@mano8/astro-auth-m8/authorization` — the TypeScript mirror of
  `auth_sdk_m8/authorization.py` — under the same names, so the package surface
  is unchanged and the fleet now states its hierarchy exactly once.
  `W6.1` had to land this as a *copy* pinned by an exhaustive agreement test,
  because the fleet's `no-cross-plugin-import` gate (`C12`) refused the import;
  the fleet-wide decision behind `W7.7` widened that gate for this one exact
  specifier, and a new `authorization-purity` gate keeps the exemption honest by
  walking the module's import closure and failing on React, on any bare
  dependency but `zod`, or on any runtime global. Nothing else in
  `@mano8/astro-auth-m8` is importable. `tests/authorization-mirror.test.ts`
  now asserts these *are* the peer's own bindings by identity, so a re-fork
  fails the build where a behavioural comparison would have passed.
- **Every planning panel carries its own `admin` write floor** (`W6.3`, §21.5).
  The six connected panels — main materialization, activity sync, secondary
  activities, plan lock/requirement generation, feasibility diagnostics and
  allocation reconciliation — were exported individually while their gate lived
  in `RepartoPlanningView`, so a host composing its own planning page got an
  ungated mutation surface. Each now renders nothing below the floor, and mounts
  none of its queries there either. `PlanningPanelGate` is exported for a host
  gating a panel of its own.
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
