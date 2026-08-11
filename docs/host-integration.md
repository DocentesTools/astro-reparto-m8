# Host integration guide

How an Astro host mounts `@mano8/astro-reparto-m8`: the routes it publishes, the
props its views take, the API and hook surface behind them, what it assumes
about authentication, and how the three stages fit together.

The package is optional per deployment. Without it installed the host builds and
runs unchanged; with it installed but no reachable API base, the views render
their own error state rather than breaking the host.

---

## 1. Install and peers

```sh
npm i @mano8/astro-reparto-m8 @mano8/astro-auth-m8 zod
```

| Peer | Why |
| --- | --- |
| `astro` ^7 | host framework |
| `@astrojs/starlight` ^0.41 | the starter routes render inside `StarlightPage` |
| `@astrojs/react`, `react`, `react-dom` | the views are React islands (optional only for a pure-schema, no-UI consumer) |
| `@tanstack/react-query` ^5 | every hook is a React Query query/mutation |
| `zod` ^4 | every response is parsed before it reaches a view |
| `@mano8/astro-auth-m8` ^2 | the official M8 session; the backend accepts `fa-auth-m8` tokens |

The backend contract is `reparto-docente-m8@2.0.0` (`>=2.0.0 <3.0.0`). A host that
already reads the service's metadata should assert it at startup rather than
discovering drift inside a view:

```ts
import { assertRepartoCompatibility } from "@mano8/astro-reparto-m8/compatibility";

// meta is the service metadata the host fetches, carrying
// `reparto_contract_version` (or `contract_version`). Throws on anything else.
assertRepartoCompatibility(meta);
```

`REPARTO_CONTRACT_VERSION` is that expected version string, and
`REPARTO_CONTRACT_OPERATIONS` is the frozen method/path/response table every
wrapper is checked against — the package's own record of the contract it speaks.

---

## 2. Integration options

```ts
faReparto({
  apiBase: "/reparto",        // default "/reparto"
  apiPrefix: "",              // default ""; e.g. "/fastapi" behind a gateway
  mode: "starter",            // default "headless"
  locales: ["en", "fr", "es"],// injects /:locale-prefixed copies of every route
  defaultLocale: "en",
  auth: { provider: "fa-auth-astro", loginPath: "/login" },
  routes: { audit: false },   // override a path, or drop a route entirely
  views: { strategy: "package" } // "none" suppresses route injection in starter mode
});
```

`apiBase` and `apiPrefix` are baked into the build as
`import.meta.env.PUBLIC_FA_REPARTO_API_BASE` / `PUBLIC_FA_REPARTO_API_PREFIX`;
the starter routes read them and pass them to the view `config` prop. A headless
host passes the same two values itself (§5). The runtime config also carries
`csrfHeader` (default `X-Requested-With`) and `requestTimeoutMs` (default
30 000), settable through `configureReparto` or any view's `config` prop.

`mode: "headless"` injects no route at all: the host owns its pages and its
navigation. `mode: "starter"` injects the whole route map below.

---

## 3. Routes and access

Every route carries two floors. `view` is the minimum role that may see it —
`reader` everywhere, because a `USER`-role session is a valid platform identity
with no capability in this application. `act` is the minimum role at which the
route's write affordances may appear, mirroring the service's own gate on the
mutations that route issues.

| Route name | Default path | Package view | `view` | `act` |
| --- | --- | --- | --- | --- |
| `schools` | `/reparto/setup/schools` | `RepartoSchoolsView` | reader | admin |
| `academicYears` | `/reparto/setup/academic-years` | `RepartoAcademicYearsView` | reader | admin |
| `departments` | `/reparto/setup/departments` | `RepartoDepartmentsView` | reader | admin |
| `classroomStages` | `/reparto/setup/classroom-stages` | `RepartoClassroomStagesView` | reader | admin |
| `teacherRoster` | `/reparto/setup/teacher-roster` | `RepartoTeacherRosterView` | reader | **writer** |
| `participants` | `/reparto/processes/[processId]/participants` | `RepartoProcessParticipantsView` | reader | admin |
| `subjects` | `/reparto/processes/[processId]/subjects` | `RepartoSubjectsView` | reader | admin |
| `classrooms` | `/reparto/processes/[processId]/classrooms` | `RepartoClassroomsView` | reader | admin |
| `groupSubjects` | `/reparto/processes/[processId]/group-subjects` | `RepartoGroupSubjectsView` | reader | admin |
| `processSettings` | `/reparto/processes/[processId]/settings` | `RepartoProcessSettingsView` | reader | admin |
| `allocation` | `/reparto/processes/[processId]/allocation` | `RepartoAllocationView` | reader | admin |
| `planning` | `/reparto/processes/[processId]/planning` | `RepartoPlanningView` | reader | admin |
| `requirements` | `/reparto/processes/[processId]/requirements` | `RepartoHourRequirementsView` | reader | admin |
| `dashboard` | `/reparto` | `RepartoDashboardView` | reader | admin |
| `processList` | `/reparto/processes` | `RepartoProcessesView` | reader | admin |
| `assignments` | `/reparto/processes/[processId]/assignments` | `RepartoAssignmentsView` | reader | admin |
| `meeting` | `/reparto/meeting/[processId]` | `RepartoMeetingView` | reader | admin |
| `teacherView` | `/reparto/processes/[processId]/my-view` | `RepartoMyView` | reader | **writer** |
| `sharedScreen` | `/reparto/processes/[processId]/shared` | `RepartoSharedView` | reader | admin |
| `versions` | `/reparto/processes/[processId]/versions` | `RepartoVersionsView` | reader | admin |
| `exports` | `/reparto/processes/[processId]/exports` | `RepartoExportsView` | reader | admin |
| `audit` | `/reparto/processes/[processId]/audit` | `RepartoAuditView` | reader | admin |

The map itself is exported: `REPARTO_ROUTE_ACCESS`, `repartoRouteAccess`,
`canViewRepartoRoute` and `canActOnRepartoRoute` from
`@mano8/astro-reparto-m8/route-access`, and `buildRepartoRoutes` /
`BuiltRepartoRoutes` from the integration entry point. A host that builds its own
navigation should filter it through `canViewRepartoRoute` so a link is never
offered to a session that would be refused at the route.

The two `writer` floors are floors, not grants: they say the tier may hold such
an affordance at all, never that this particular record belongs to the caller.
`teacherRoster` applies its own per-row ownership check on top (a `WRITER` edits
their own `TeacherProfile` and no one else's); creating, linking and deleting a
profile stay `admin`. `teacherView` covers the caller's own direct selection and
their own turn.

Changing or dropping a path:

```ts
faReparto({
  mode: "starter",
  routes: {
    dashboard: "/teaching/overview",
    audit: false           // not injected, and buildRepartoNav skips it
  }
});
```

Navigation is host-owned. `DEFAULT_REPARTO_NAV` and `buildRepartoNav(routes)`
return the three stage groups with `labelKey`s resolved against the package
dictionary and `[processId]` rendered as `current`; a host is free to reorder,
relabel or ignore them.

---

## 4. Starter host example

```ts
// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import faAuth from "@mano8/astro-auth-m8";
import faReparto from "@mano8/astro-reparto-m8";

export default defineConfig({
  integrations: [
    react(),
    starlight({ title: "Docentes" }),
    faAuth({ apiBase: "/user" }),
    faReparto({ mode: "starter", apiBase: "/reparto", apiPrefix: "/fastapi" })
  ]
});
```

`@mano8/astro-auth-m8` must be listed **before** `faReparto`: the integration
warns at build time when it is missing or ordered after. With the default
`auth.provider: "fa-auth-astro"` the integration injects a page script that
registers the fa-auth browser session as the reparto auth adapter and sends an
unauthenticated visitor of a reparto route to `loginPath` with a `next`
parameter. `auth.provider: "custom"` skips that injection entirely — the host
then calls `setRepartoAuthAdapter` itself (§8) — and `"none"` builds the starter
routes with no session wiring at all, which the integration warns about.

Nothing else is required: each injected route is a Starlight page that mounts the
package view with `client:only="react"`, reads the two `PUBLIC_FA_REPARTO_*`
values into `config`, and passes `Astro.currentLocale` and the `processId`
param through.

---

## 5. Headless host example

In `headless` mode the host owns the page, the path and the navigation entry, and
mounts the same view:

```astro
---
// src/pages/teaching/planning.astro
import StarlightPage from "@astrojs/starlight/components/StarlightPage.astro";
import { RepartoPlanningView } from "@mano8/astro-reparto-m8/default-ui";

const config = {
  apiBase: import.meta.env.PUBLIC_FA_REPARTO_API_BASE,
  apiPrefix: import.meta.env.PUBLIC_FA_REPARTO_API_PREFIX
};
---

<StarlightPage frontmatter={{ title: "Planning", tableOfContents: false }}>
  <RepartoPlanningView
    client:only="react"
    config={config}
    locale={Astro.currentLocale}
    processId={Astro.params.processId ?? "current"}
  />
</StarlightPage>
```

Composing the pieces instead of taking a whole view — the host supplies the
providers, the package supplies the data and the panels:

```tsx
import { QueryClient } from "@tanstack/react-query";
import {
  RepartoProvider,
  RepartoQueryProvider
} from "@mano8/astro-reparto-m8/react";
import {
  MainSubjectMaterialization,
  RepartoRouteGuard
} from "@mano8/astro-reparto-m8/default-ui";

export function HostPlanning({ processId }: { processId: string }) {
  return (
    <RepartoQueryProvider>
      <RepartoProvider config={{ apiBase: "/reparto", apiPrefix: "/fastapi" }}>
        <RepartoRouteGuard route="planning">
          <MainSubjectMaterialization processId={processId} />
        </RepartoRouteGuard>
      </RepartoProvider>
    </RepartoQueryProvider>
  );
}
```

`RepartoQueryProvider` supplies the React Query client, `RepartoProvider`
applies `config` and resolves the auth adapter, and `RepartoRouteGuard` applies
the route's `view` floor. Any package hook used outside that pair throws rather
than silently issuing an unauthenticated request.

A host with no React at all can still use the package as a typed client:
`@mano8/astro-reparto-m8/api` (wrappers), `/schemas` (Zod types), `/decimals`
(hour arithmetic), `/ui` (framework-neutral view-state helpers), `/error-mapping`
and `/i18n` carry no React import.

---

## 6. Required props

Every default view takes the same four optional props, and **none of them is
required**: a view mounted bare resolves its own process and fetches its own
data.

| Prop | Type | Meaning |
| --- | --- | --- |
| `config` | `Partial<RepartoRuntimeConfig>` | `apiBase`, `apiPrefix`, `csrfHeader`, `requestTimeoutMs`. Omit only if the host already called `configureReparto`. |
| `locale` | `"en" \| "fr" \| "es"` | Dictionary selection; an unknown value normalizes to `en`. |
| `processId` | `string` | A process UUID, or the `"current"` placeholder. |
| *data props* | see below | Server-supplied payloads that bypass the view's own query. |

`processId="current"` (and an omitted `processId`) means "no concrete process
yet": the view renders its process picker, remembers the choice in
`localStorage` under `reparto.lastProcessId`, and reuses it on the next visit.
The picker selects by academic year, school and department — never by raw UUID.

The data props exist so a host that already holds a payload can render without a
second fetch; supplying one bypasses the picker for that view:

| View | Data props |
| --- | --- |
| `RepartoDashboardView` | `dashboard`, `summary`, `feasibility` |
| `RepartoMyView` | `summary` (`TeacherLanSummary`), `assignments`, `requirements`, `meetingSession`, `readiness`, `selectionBlocked`, `remainingTargetHours`, `selectedSlotId` |
| `RepartoSharedView` | `summary` (`ProcessSummary` **only** — the aggregate payload names nobody) |
| `RepartoVersionsView` | `versions`, `comparison` |
| `RepartoExportsView` | `artifacts`, `plan`, `processStatus` |

Two props are deliberately absent and must not be re-introduced by a host: a
view mode literal (`admin`/`readonly` is derived from the signed-in role by
`useRepartoViewMode`, never passed in) and a `dashboard` payload on the shared
screen (the projector must not hold per-teacher data).

`GroupSubjectBulkEditor` is a panel a headless host may mount itself, but it is
**not** host-mounted work in `starter` mode: the package's own `groupSubjects`
route mounts it, next to the matrix list and the per-cell form. Treating it as
host-only is what left the matrix unreachable in a host that mounts package
starter routes and nothing else.

Panels below view level — `TeachingPlanCreation`,
`MainSubjectMaterialization`,
`SecondaryActivityEditor`, `PlanLockAndRequirementGeneration`,
`AllocationChangeReconciliation`, `MeetingControlWorkspace`,
`TeacherLanWorkspace`, `SharedScreenWorkspace` — take `processId` plus an optional
`locale` (and, for the workspaces, the same optional payload props as their
view), and expect the provider pair above them. The purely presentational pieces
(`PlanningBalanceHeader`, `PlanValidationSummary`, `PlanLockConfirmation`,
the preview/result cards)
take the payload and the dictionary they render and issue no request of their
own, so a host can drive them from data it already holds.

`PlanUnlockControl` sits between the two: it takes the plan and the dictionary
like the presentational cards, but reads the `admin` write floor from the
signed-in session through `useRepartoCanAct` rather than from a prop (§21.5), so
a host mounting it directly still gets the floor applied.

---

## 7. API surface

Public modules are reachable only through explicit package subpaths:

| Subpath | Contents |
| --- | --- |
| `@mano8/astro-reparto-m8` | the Astro integration, `buildRepartoRoutes`, `DEFAULT_REPARTO_NAV`, `buildRepartoNav` |
| `/api` | the HTTP wrappers plus the error-mapping source |
| `/schemas` | every Zod schema and inferred public type |
| `/decimals` | canonical hour schemas, integer-hundredths arithmetic, input parser |
| `/client` | the fetch client the wrappers are built on |
| `/auth-adapter` | `RepartoAuthAdapter`, `createFaAuthAdapter`, `setRepartoAuthAdapter`, role helpers |
| `/fa-auth-bridge` | `installRepartoFaAuthBridge` (what starter mode injects) |
| `/route-access` | the route→role map and its two predicates |
| `/routes` | `buildRepartoRoutes`, `RepartoRouteName`, the default patterns |
| `/react` | providers, ~90 hooks, role hooks, `useRepartoEventStream` |
| `/default-ui` | the route views, workspaces and planning/CRUD panels |
| `/ui` | framework-neutral view-state helpers (no React import) |
| `/i18n` | `en`/`fr`/`es` dictionaries, `formatRepartoMessage`, locale normalization |
| `/sse` | event parsing, cursor advance and query-invalidation mapping |
| `/error-mapping` | backend error → field/form/disabled-reason mapping |
| `/compatibility` | contract version, operation table, assertion |

`/api` groups one object per resource, each method being one backend operation:

| Wrapper | Covers |
| --- | --- |
| `schools`, `academicYears`, `departments`, `teacherProfiles`, `classroomStages` | stage-1 global setup |
| `assignmentProcesses` | processes, `update` (the five settings fields — never `status`), `reopen`, dashboard, summary, `myLanSummary`, versions, exports |
| `processTeachers` | participants, and the reason-required extra-hours operation |
| `subjects`, `teachingGroups`, `groupSubjects` | subjects, groups, and the matrix with its preview/apply pair; a cell leaves the plan through `retire`, never a delete |
| `allocationRevisions` | `list` / `current` / `create` — no update, no delete, by contract |
| `teachingPlans` | plan get/create, summary, validations, lock, materialization, generation and reconciliation preview/apply |
| `teachingActivities` | live activity create/read/update, linked groups, and `retire` — no delete, by contract |
| `hourRequirements` | generated slots, read-only |
| `assignments` | create, notes update, `undo`, `reassign`, direct choice, validations |
| `meetingSessions`, `selectionTurns` | the meeting and its turns |
| `planningExchange`, `planningExportRequest` | planning import/restore and the three planning export modes |
| `history`, `auditEvents` | versions/comparison and the audit trail |

Each wrapper has a React Query hook of the same shape in `/react`
(`useReparto*` for reads, `useCreateReparto*` / `useUpdateReparto*` /
`useDeleteReparto*` and the named commands for writes). A read hook takes
`processId?` and stays disabled until a concrete id is resolved; a mutation hook
takes `{ processId, body }` and invalidates the affected projections itself, so
a host does not maintain its own cache map.

The exact paths, verbs and response shapes are inventoried in
[`contract-inventory.md`](contract-inventory.md); the user-visible vocabulary is
frozen in [`ui-naming-freeze.md`](ui-naming-freeze.md).

---

## 8. Auth assumptions

- **The service is the authorization boundary.** Every gate in this package is a
  statement about what to *show*; each request behind it is authorized again by
  `reparto-docente-m8`.
- **One role order, one comparison.** `REPARTO_ROLE_ORDER` is
  `user < reader < writer < admin < superadmin`, mirroring the service's own
  `has_minimum_role`. `hasMinimumRole` is the single implementation; no view
  re-derives it. `is_superuser` reads as `superadmin`.
- **Fails closed.** No session, an unresolved session and an unrecognised role
  all answer "no". While the adapter has not answered, `RepartoRouteGuard`
  renders neither the content nor a refusal — "not yet" is not "not allowed".
- **The signed-in user is the only source.** Role never arrives as a prop or a
  query parameter (`useRepartoCurrentUser` / `useRepartoViewMode` /
  `useRepartoCanAct`).
- **Department-head authority is `ADMIN`/`SUPERADMIN` and nothing else.**
  `department_head_user_id` is descriptive and is never an authorization input.
- **Tokens come from the adapter, never from the package.** It holds no
  credential, no cookie policy and no refresh schedule of its own.

A host that is not using `fa-auth-astro` registers its own adapter once, before
the first view mounts:

```ts
import { createFaAuthAdapter, setRepartoAuthAdapter } from "@mano8/astro-reparto-m8/auth-adapter";

setRepartoAuthAdapter(
  createFaAuthAdapter({
    getToken: () => session.accessToken,
    refreshToken: () => session.refresh(),
    getCurrentUser: () => session.user, // { id, role, is_superuser }
    onUnauthenticated: () => location.assign("/login")
  })
);
```

`getCurrentUser` is what the two floors read. An adapter that omits it leaves
every view below its `view` floor — deliberately: an unknown role is not a
permitted one.

---

## 9. Three-stage integration

The domain runs in three stages, and the routes above are grouped to match. A
stage is not merely a UI ordering: the service refuses stage-3 work against a
plan that has not completed stage 2.

### Stage 1 — Configuration

School, academic year, department, classroom stages and the teacher roster, then
the process-scoped configuration: participants with their base and authorized
extra hours, subjects with their suggested planning defaults, teaching groups,
and the group-subject matrix that holds the **actual** planning values.
The matrix has its own route, `groupSubjects`: it lists the cells that exist,
offers a single-cell add/edit form, and mounts `GroupSubjectBulkEditor`, which
fills the matrix one subject at a time across a filtered group range. The apply
request is never issued without a successful preview, and a stale preview is
refused with **409** rather than committed. Nothing in Stage 2 has an input
until at least one cell exists.

Leadership's weekly group-hour allocation is recorded here as the first
immutable revision (`allocationRevisions.create`), on its own `allocation`
route. Until one exists, `allocationRevisions.current` answers **404** — a normal
state for a new process, not an error to surface as a failure.
`LeadershipAllocationPanel` is the one implementation: the route frames it as
§8.2 step 2, and `AllocationChangeReconciliation` on `/planning` embeds the same
panel for the case it was written for, resolving a *change*.

Stage 1 closes with `processSettings` (§8.2 step 7): the hours reference every
participant is measured against, the selection order and its mode, and the two
switches that decide whether Stage 3 has a direct-selection and a LAN surface at
all. Only the fields the operator changed are sent. The route also carries the
reopen control — `POST …/reopen` with its required reason — which appears only
while the process is `final` or `archived`, because that is when every child
write is refused with *"reopen it first"*. Reopening is accepted for `final`
alone; `archived` is terminal and gets the explanation without the control.
There is no status or transition control anywhere in the package: the service
reserves `status` for `POST …/transition`, and opening a meeting session already
sets `MEETING_OPEN` itself.

### Stage 2 — Planning

`/planning` turns that configuration into a locked plan:

0. **Plan creation** — a process owns at most one teaching plan and the row is
   not created with the process, so `teachingPlans.get` (and every other Stage 2
   read) answers **404** until an operator creates it. `TeachingPlanCreation`
   shows that 404 as an empty state, never as a failed request, and offers
   `useCreateRepartoTeachingPlan` at the `admin` write floor; the panel
   disappears once the plan exists, and a 409 from a second attempt is shown in
   the service's own words.
1. **Allocation and history** — the current revision and every superseded one.
2. **Two balances, always visible** — group hours (target / planned /
   difference) and teacher load (target / planned / difference). They are two
   axes and are never summed: co-teaching legitimately yields 120 group hours
   against 124 teacher-load hours, with both figures correct.
3. **Main-subject materialization** — the idempotent, missing-only creation of
   `main_generated` activities from the matrix.
4. **Secondary activities** — tutoring, co-teaching and the rest, with their own
   group hours, teacher hours per position and position count.
5. **Validations** — the service's own report, as stable codes plus entity
   references; the client holds no copy of the vocabulary.
6. **Lock** — offered only for a balanced, currently feasible plan without
   blocking findings, and confirmed explicitly.
7. **Generate requirements** — available once the service reports a `locked` or
   `stale` plan. The deterministic create/preserve/retire/conflict diff is
   previewed and confirmed before it is applied.
8. **Reconciliation** — a new allocation revision marks the plan stale and blocks
   new assignments until the affected positions are explicitly released,
   replaced or retired. Apply carries a reason and the preview's exact conflict
   count.

`/requirements` is the read-only result: generated slots grouped by teaching
activity and position, with their lifecycle status and lineage. There is no
manual requirement CRUD — slot identity and hours change only through generation
or explicit reconciliation.

### Stage 3 — Assignment

`/assignments`, `/meeting`, `/my-view` and `/shared-screen` hand the generated
slots out. One row is one participant holding one complete slot in full: no hour
input, no share type, no over-assignment override. Cancelling is the
reason-required `undo`, moving a slot the reason-required `reassign`. Teachers
select their own positions on `/my-view`; the meeting control room drives turns;
the projected screen shows aggregates that name nobody.

`/versions` captures immutable snapshots and diffs two of them across nine
dimensions; `/exports` separates planning draft/provisional artifacts — never
withheld for an inexact, unbalanced or stale plan — from the strict final
assignment export, which requires complete reparto plus confirmed feasibility
and archives the process.

### Live updates

Every stage-2 and stage-3 view refreshes from the process event stream. A host
composing its own view opts in with the same hook:

```tsx
const { connectionState, lastEventType } = useRepartoEventStream(
  processId,
  "department_head" // or "teacher" | "shared_screen"
);
```

The stream is bearer-authenticated through the auth adapter (native
`EventSource` cannot carry the header, so the client reads the Fetch body while
preserving SSE framing). It validates all eleven backend event types against the
audience, invalidates exactly the affected queries, and refetches the
authoritative process after a reconnect, a sequence gap or a non-increasing
sequence. `connectionState` reports `live` / `stale` / `disconnected` so a LAN
view can say so instead of showing silence as agreement.

---

## 10. Hours are decimal strings

Every weekly hour in the contract is a two-decimal quantity exchanged as a
canonical string (`"2.50"`, signed `"-4.00"`). A host must not do hour
arithmetic in JavaScript numbers: use `addHours`, `subtractHours`, `sumHours`,
`multiplyHours`, `compareHours`, `hoursEqual` and the
`parseHoursField` / `formatHoursField` input pair from
`@mano8/astro-reparto-m8/decimals`, which run every calculation through integer
hundredths. An empty hour field means "inherit the default" and is not the same
value as a typed `0`; no form may collapse the two.

---

## 11. Working examples in this repository

- [`fixtures/starlight-starter`](../fixtures/starlight-starter) — a Starlight
  host in `starter` mode, with the sidebar grouped by the three stages.
- [`fixtures/starlight-headless`](../fixtures/starlight-headless) — a Starlight
  host in `headless` mode that owns its own page and mounts a package view on it.

Both are built by `npm run verify:starter-routes`, so an example that stopped
compiling fails the repository's own gate.
