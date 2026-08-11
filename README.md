# @mano8/astro-reparto-m8

![CI/CD](https://github.com/DocentesTools/astro-reparto-m8/actions/workflows/CI.yaml/badge.svg?branch=main)

Astro integration and headless client for `reparto-docente-m8`.

## Install

```sh
npm i @mano8/astro-reparto-m8 @mano8/astro-auth-m8 zod
```

## Quick start

```ts
import { defineConfig } from "astro/config";
import faAuth from "@mano8/astro-auth-m8";
import faReparto from "@mano8/astro-reparto-m8";

export default defineConfig({
  integrations: [
    faAuth({ apiBase: "/user" }),
    faReparto({ apiBase: "/reparto", mode: "starter" })
  ]
});
```

`@mano8/astro-auth-m8` is listed first on purpose: the backend accepts
`fa-auth-m8` tokens, and the integration warns when its auth peer is missing or
ordered after it. `mode: "starter"` injects the whole route map below;
`mode: "headless"` (the default) injects nothing and leaves pages and navigation
to the host.

**[`docs/host-integration.md`](docs/host-integration.md) is the integration
reference**: integration options, the route map with its role floors, the props
every view takes, the API and hook surface, the auth assumptions, and worked
starter and headless host examples. The sections below describe what each
surface *does*.

## The three stages

The domain runs in three stages, and the sidebar and route map are grouped to
match. The order is enforced by the service, not merely suggested by the UI:
stage-3 work is refused against a plan that has not completed stage 2.

1. **Configuration** — school, academic year, department, classroom stages,
   teacher roster; then per process: participants and their base/extra hours,
   subjects and their suggested defaults, teaching groups, and the
   group-subject matrix that holds the actual planning values. The leadership
   allocation is recorded here as the first immutable revision on its own
   `/allocation` route (§8.2 step 2), and the process
   settings — the hours reference, the selection order and the direct-selection
   and LAN switches — close the stage.
2. **Planning** — `/planning` materializes main-subject activities from that
   matrix, adds secondary activities, keeps the two balances visible, surfaces
   the service's validations, and then locks the plan and generates the
   requirement slots. A later allocation revision marks the plan stale and sends
   it through explicit reconciliation. `/requirements` is the read-only result.
3. **Assignment** — `/assignments`, `/meeting`, `/my-view` and `/shared-screen`
   hand the generated slots out, one complete slot per participant, with
   `/versions` and `/exports` alongside.

## Routes and roles

| Stage | Routes |
| --- | --- |
| Configuration | `/reparto`, `/reparto/processes`, `/reparto/setup/{schools,academic-years,departments,classroom-stages,teacher-roster}`, `/reparto/processes/[processId]/{allocation,participants,subjects,teaching-groups,group-subjects,settings}` |
| Planning | `/reparto/processes/[processId]/{planning,requirements}` |
| Assignment | `/reparto/processes/[processId]/{assignments,my-view,shared,versions,exports,audit}`, `/reparto/meeting/[processId]` |

Every path is overridable, and any route can be dropped with `false`, through
the integration's `routes` option. Each one carries two floors: the minimum role
that may **see** it (`reader` everywhere — a `USER`-role session has no
capability in this application) and the minimum role at which its **write**
affordances may appear (`admin`, except `my-view` and the teacher roster, whose
own-data actions are `writer`). `RepartoRouteGuard` applies the read floor and
`useRepartoCanAct` the write floor, both from the signed-in user and never from
a caller-supplied prop. The guard states what to show; the service remains the
authorization boundary. The map is exported from
`@mano8/astro-reparto-m8/route-access`.

## Classroom stages and bulk teaching groups

The plugin exposes global classroom-stage schemas, API helpers, React Query
hooks, and the `/reparto/setup/classroom-stages` starter route. Stage reads are
available to authenticated users; mutation controls and the management route
use the auth adapter's existing `admin`/`superadmin` capability while the
backend remains authoritative.

Teaching-group forms submit `classroom_stage_id`, constrain grade to the selected
stage, and generate `{grade}° {stage.label} {group_code}` until the label is
manually changed. The bulk dialog previews an inclusive A-Z range and submits
one atomic request to the process-scoped groups endpoint. Mutation feedback uses
the canonical shadcn Sonner toast contract from `astro-ui-m8`.

## Decimal hours

Every weekly hour value in the backend contract is a two-decimal quantity
exchanged as a canonical string such as `"2.50"`, and hour differences are
signed (`"-4.00"`). `@mano8/astro-reparto-m8/decimals` owns that representation:

- `HoursSchema` / `SignedHoursSchema` read what the backend sends — a canonical
  string on computed schemas, a JSON number on entity schemas whose column sweep
  is still open — and normalize both to a canonical string. Compose with
  `.nullable()` for an hour column whose `NULL` means "inherit the default".
- `CanonicalHoursSchema` / `CanonicalSignedHoursSchema` validate the canonical
  string form strictly, for payloads the UI builds.
- `addHours`, `subtractHours`, `sumHours`, `multiplyHours`, `compareHours` and
  `hoursEqual` run every calculation through integer hundredths, so no balance,
  target or difference is ever computed in binary floating point.
- `parseHoursField` / `formatHoursField` back hour inputs, keeping an empty
  field ("inherit the default") distinct from a typed `0`.

The schemas are also re-exported from `@mano8/astro-reparto-m8/schemas`.

## Allocation revisions

School leadership communicates a weekly group-hour allocation to the department,
and may revise it at any time. The value is never overwritten: every figure is an
immutable revision, exactly one of which is current. `allocationRevisions.list`
returns the history oldest-first, `allocationRevisions.current` returns the
single non-superseded revision (**404** while no allocation has been communicated
yet — a normal state for a new process), and `allocationRevisions.create` records
a new one, superseding the previous revision and emitting an audit event. There
is no update or delete wrapper, by contract.

`reason` is mandatory on create, `allocated_group_weekly_hours` must be greater
than zero, and the create schema normalizes it to the canonical `"120.00"` string
(rejecting a third decimal place rather than rounding it). A `final` or
`archived` process must be reopened before its allocation can change.

## Subjects and the group-subject matrix

A subject no longer carries a two-stage `stage`. It classifies itself with
`allocation_category` (`main`/`secondary` — the mandatory-vs-optional planning
distinction, never a boolean `is_main`) and a descriptive `activity_type`, and
carries *suggested* planning defaults. The defaults only seed new rows: editing
one never rewrites an already-materialized group-subject cell or activity.

`groupSubjects` wraps the matrix itself — one cell per (group, subject) pair,
holding the **actual** planning values. `teaching_group_id` and `subject_id` are
the immutable identity of a cell: re-targeting one means deleting it and creating
another. An empty hour **inherits the subject default** (the backend stores
`NULL`) while a typed `0` is a real zero; `parseHoursField` from
`@mano8/astro-reparto-m8/decimals` keeps the two apart, and no form may collapse
them.

`groupSubjects.bulkPreview` and `groupSubjects.bulkApply` are a pair, not two
independent calls. Preview dry-runs one subject across the groups matched by the
optional stage / grade-range filters and returns the create/update/unchanged
split, per-group conflicts, selection-level `validation_errors` and an
`expected_affected_count`. Apply sends that count back; the backend recomputes
and answers **409** when the selection changed in between, so a stale
confirmation can never be committed — re-preview rather than retrying the apply.
The set values follow the backend's present-vs-absent semantics: a field you omit
is left untouched, an explicit `null` hour clears an override back to "inherit",
and `required_teacher_count` takes only a positive integer because its column is
`NOT NULL`.

`RepartoGroupSubjectsView` is the matrix's own starter route
(`/reparto/processes/[processId]/group-subjects`, `reader`/`admin`): it lists
the cells that exist, adds or edits one cell through
`useCreateRepartoGroupSubject` / `useUpdateRepartoGroupSubject`, and mounts the
bulk editor below them.

`GroupSubjectBulkEditor` is exported from
`@mano8/astro-reparto-m8/default-ui`. It loads the process subjects and
teaching groups through the package hooks, exposes the three backend modes and the
stage/grade filters, and renders the complete create/update/unchanged/conflict
preview before enabling apply. Apply is a separate confirmation step. A 409
clears the preview and requires a fresh preview; the component never retries a
stale selection.

## Process settings and reopen

`RepartoProcessSettingsView` is the settings starter route
(`/reparto/processes/[processId]/settings`, `reader`/`admin`). It saves the five
fields `PATCH /assignment-processes/{id}` accepts —
`default_teacher_hours_reference`, `selection_order_enabled`,
`selection_order_mode`, `direct_teacher_selection_enabled` and
`lan_access_enabled` — through `useUpdateRepartoProcess`, sending only the ones
that changed. A blank hours reference is an explicit `null`; a typed `0` is a
real zero.

`status` is shown and never offered: the service answers **400** for a `status`
field on the patch (*"owned by the transition endpoint"*), and opening a meeting
session sets `MEETING_OPEN` itself, so the package ships no transition control.

The same route carries `ProcessReopenControl`. It appears only while the process
is frozen — `final` or `archived`, the two statuses in which every child write
is refused — and offers the reason-carrying `POST …/reopen` for `final` alone,
since `archived` is terminal. `buildProcessSettingsRequest`,
`buildProcessReopenState` and their helpers are exported framework-free from
`@mano8/astro-reparto-m8/ui`.

## Teaching plans and activities

`teachingPlans` wraps the process's single intermediate plan: get/create, the
dual planning summary, structured validations, feasibility-gated locking, and
idempotent main-activity materialization. Plan lifecycle status and assignment
feasibility remain separate axes. The summary likewise keeps group teaching
hours and teacher workload independent; signed differences are canonical
decimal strings, and the validation report exposes stable codes plus entity
references rather than requiring consumers to parse display text.

`teachingActivities` exposes the live activity list and its create/read/update
contract, plus guarded `retire`: neither a teaching activity nor a
group-subject cell is ever deleted, so the plugin sends no `DELETE` on either
path. An activity carries its complete planning values, source and sync state,
materialization lineage, retirement timestamp, and the full
`group_subject_ids` link set. Outgoing hours are canonicalized to two-place
strings. Duplicate links, immutable identity fields, non-positive teacher
counts, and manual attempts to create `main_generated` activities are rejected
before fetch; subject-specific zero/multiple-group policy remains
backend-authoritative.

`MainSubjectMaterialization` is exported from
`@mano8/astro-reparto-m8/default-ui` and is mounted by the package-owned
`/planning` view. It compares active main-subject matrix rows with live
`main_generated` activities, labels every row as missing or materialized, and
shows the values that will be or were materialized. The create action is enabled
only while rows are missing and requires a separate missing-only confirmation;
the backend's idempotent endpoint remains the concurrency barrier, so an
already-materialized row is skipped rather than duplicated.

`SecondaryActivityEditor` is also exported from
`@mano8/astro-reparto-m8/default-ui` and mounted by `/planning`. It creates,
updates and deletes live secondary activities through the package hooks. The
form supports descriptive tutoring/co-teaching labels, subject-policy-aware
zero/single/multi-group selection, independent group and teacher hours, and a
positive teacher-position count. Hour inputs use the decimal-safe parser and
are sent as canonical two-place strings; activity type remains descriptive and
never drives domain behavior. Every mutation refreshes the activity list,
planning balance, requirement, dashboard and summary projections.

`PlanLockAndRequirementGeneration` completes the next planning step. It reads
the service-owned validation report and teaching-plan status, enables a focused
lock confirmation only for a balanced, currently feasible plan without
blocking findings, and sends the lock command to the backend as the final
authority. Generation becomes available only after the service returns a
`locked` or `stale` plan. The component then previews the deterministic
create/preserve/retire/conflict diff and requires a separate confirmation before
generation. The applied result shows the generation number and authoritative
live-slot count; conflicts disable apply and direct the user to reconciliation.

Locking is not a one-way door. The same panel carries the unlock control: it
appears whenever the plan's status refuses planning edits, states the plan
§20.14 / §20.15 requirement as a status line rather than an error, and offers
`POST …/teaching-plan/unlock` behind the `admin` write floor. The service
accepts an unlock for a locked pre-generation plan only, so a
`requirements_generated`, `stale` or `reconciliation_required` plan is told that
regeneration or reconciliation is its way forward instead of being handed a
control that would answer 409.

`AllocationChangeReconciliation` supplies that explicit reconciliation surface
and is mounted by `/planning`. Department heads can record an immutable,
reasoned allocation revision; history remains visible while the service marks
the plan stale and blocks new assignments. The reconciliation preview keeps
unchanged requirements and existing assignments visible, identifies each
affected assigned position and shows the manual release/replace or
release/retire action. Apply requires a reason plus the preview's exact conflict
count. A 409 discards the stale preview instead of retrying, and the result shows
released assignments, generation counts and the authoritative live-slot count.

## Generated slots and the assignment board

The `/requirements` starter route is the read-focused result surface for those
workflows. It validates the generated-slot contract, groups slots by
teaching activity and zero-based service position (shown one-based to users),
and displays authoritative plan generation/reconciliation state plus per-slot
`available` / `assigned` / `stale` / `reconciliation_required` status. Manual
requirement create, edit, bulk-create and delete APIs, hooks and dialogs are not
exported: slot identity and hours change only through generation or explicit
reconciliation.

The `/assignments` starter route is the assignment board. A row states that one
participant holds one complete requirement slot in full, so the board has no
hour input, no share type and no over-assignment override: the hours shown come
from the generated slot and are read-only. Assigning offers only free live slots
and, for the selected slot, only participants the service would accept — an
inactive participant, one who already holds another position of the same
teaching activity, and one the slot would push past their remaining target are
listed with the reason instead of being silently dropped. The remaining target
comes from the participant row's own service-computed `target_weekly_hours`, so
the exact-fit rule (§3.8) is pre-filtered everywhere; a `remainingTarget` lookup
may still override it per view. The same eligibility helpers are exported from
`@mano8/astro-reparto-m8/ui` (`buildAssignmentSlotOptions`,
`buildAssignmentTeacherOptions`, `buildReassignmentTeacherOptions`) so a host UI
disables the same choices for the same reason. When the plan is currently
feasible, the administrator board also reads the restricted witness endpoint
and applies a conservative subset of the backend's cheap guards: a choice
that provably fails those guards is shown disabled, the witnessed
choice is marked safe, and other choices remain subject to the authoritative
server-side repair. A stale or unavailable witness fails closed. The mapping is never rendered or passed to
the teacher LAN/shared-screen views; teachers see only the service's role-safe
readiness status. Cancelling is the reason-required
`undo` action, which releases the slot and re-enters the teacher's completed
meeting turn; moving a slot is the reason-required `reassign` action, a single
atomic service operation rather than a delete plus a create. Several live rows can be undone together from
a table selection: one dialog collects one reason, records it on each row and
applies them one at a time, stopping at the first refusal and reporting how many
went through — the rows already undone stay undone. Cancelled rows stay visible
as history without actions, and the board reads the service's assignment-stage
validation report rather than inferring findings from the table.

## Teacher LAN view and participant hours

The teacher direct-selection panel on `/my-view` takes the live positions
rather than a required/assigned hour pair: a teacher takes a whole position or
none, so the panel lists the positions with their own hours and marks each one
selectable or blocked. `buildTeacherChoiceState` from
`@mano8/astro-reparto-m8/ui` returns stable reason codes — never sentences —
for both the panel (`meeting_not_open`, `direct_selection_disabled`,
`plan_not_ready`, `reconciliation_required`, `selection_blocked`,
`not_your_turn`, `no_slot_chosen`) and each position (`slot_occupied`,
`slot_not_available`, `duplicate_activity_position`,
`exceeds_remaining_target`), and the dictionary translates them. Every gate
fails closed: without the service's `readiness` and `selection_blocked` the
panel refuses instead of assuming the assignment stage is open.
`classifyDirectChoiceConflict` keys a refused choice off the HTTP status (409
"the reparto moved, refresh and choose again" versus 400/422 "this choice breaks
a rule") and passes the service's own sentence through untranslated, instead of
searching it for keywords.

`GET /…/lan/me` answers all three of those questions itself, so
`TeacherLanWorkspace` reads `readiness`, `selection_blocked` and the caller's own
remaining target from the payload; the matching props remain as overrides for a
host that already holds fresher values. The teacher panel shows the five figures
that make up a participant target — **base**, **authorized extra**, **target**,
**assigned** and **remaining** — rather than the retired "available hours"
capacity, plus the number of complete positions still free and the aggregate,
identifier-free plan balance. Authorized extra hours are the department head's
act, not a tolerance applied afterwards: they are absent from the participant
`PATCH` on both sides of the wire and change only through
`POST /…/teachers/{id}/extra-hours` with a mandatory reason
(`useUpdateRepartoProcessTeacherExtraHours`), in either direction — withdrawing
an authorization is the same action with `0`.

## Dashboard, meeting control and shared screen

The `/dashboard`, `/meeting` and `/shared-screen` routes read the two-stage
payloads. `GET /…/dashboard` is `readiness` plus a **planning** section (the
teaching plan, both balances and the planning findings — all null together when
the process has no plan yet) and an always-present **assignment** section (the
per-participant balances, the live-slot counts and the assignment findings). The
two are shown side by side and are never summed: §3.2's co-teaching example is
120 group hours and 124 teacher-load hours with both figures correct. The three
invariants — group balance, teacher-load balance and readiness — render as three
separate `data-reparto-invariant` slots rather than one "ready" badge, and an
absent figure (no allocation, no plan) is rendered as a dash, never as zero.
Findings are printed from the service's own message with its stable `code` on
the DOM; the client holds no copy of the validation vocabulary.

`MeetingControlWorkspace` is the control room, not the dashboard again: both
balances, whether the plan has gone stale or needs reconciling, how many
complete positions are still to hand out, who is carrying authorized extra
hours, and the turn controls. `buildMeetingControlState` from
`@mano8/astro-reparto-m8/ui` gates those controls on the same lifecycle state
the service consults and returns stable reason codes (`no_process_data`,
`plan_not_ready`, `reconciliation_required`, plus `turn_active` /
`no_active_turn` per action). It fails closed: with no payload every control is
disabled and says why.

`SharedScreenWorkspace` takes a `ProcessSummary` and nothing else. The aggregate
endpoint carries no participant name or per-teacher hours at all, so the
projected screen cannot show one — the redaction is the endpoint's, not a rule
the client has to remember. It shows the same two balances (they name nobody),
the three invariants, the pending positions, the lifecycle state and whose turn
it is by position. The `dashboard` prop is gone from both the workspace and
`RepartoSharedView`.

## Versions and comparison

The `/versions` route captures immutable snapshots and diffs two of them. A
comparison is the service's own §10.3 answer: nine change flags — leadership
allocation, group hours, teacher load, subject category, activities, activity
group links, teacher positions, participant targets and requirement generation
— each rendered whether it changed or not, with the signed deltas the service
pairs to it. A flag is a set comparison and a delta is arithmetic on totals, so
"one activity added, one removed" is a real change with a zero count and the
package never infers one from the other. Every hour delta stays the service's
canonical two-decimal string; only a leading `+` is added, from the sign the
decimal helpers computed. `allocation_delta` is `null` when one side has no
allocation, and that renders as **Not comparable**, never as `0.00`.

Three states are kept apart, because collapsing them would each time state
something false: nothing has been compared yet, the two snapshots are
identical, and every dimension is unchanged while snapshot sections still
differ. `buildVersionComparisonView` and `buildVersionSelectionState` from
`@mano8/astro-reparto-m8/ui` are the framework-neutral helpers behind that;
the selection defaults to the last two captures, refuses a version compared
with itself, and drops a version id the process does not own rather than
sending it. The previous-year diff (`GET /…/compare-previous-year`) shares the
panel and is offered only when the process records a `created_from_process_id`
— the service answers 400 otherwise.

## Package structure

The package follows the `astro-prompt-m8` plugin structure: typed Zod schemas,
API wrappers, auth adapter, optional starter routes, and explicit package
exports. Official M8 usage requires `@mano8/astro-auth-m8` because the backend
accepts `fa-auth-m8` tokens.

## Registry skins

React UI should stay pure shadcn/Tailwind. Table and list screens should use the
canonical `@mano8/astro-ui-m8` data-table/state blocks, and dashboard charts
should use shadcn chart patterns.

This package ships shadcn registry items under `registry/r`:

- `reparto-processes-table` - editable process table skin using the canonical
  M8 data table.
- `reparto-state-panel` - loading, empty, error, and unauthorized state adapter
  using the canonical M8 state blocks.
- `reparto-starter-views` - starter copied skins for the dashboard, meeting,
  processes, teacher, shared, versions, and exports islands.

Consumers need shadcn configured with the usual `@/components/ui/*` and
`@/lib/utils` aliases, and should install the registry items from the package:

```sh
npx shadcn add ./node_modules/@mano8/astro-reparto-m8/registry/r/reparto-starter-views.json
```

Regenerate registry output with:

```sh
npm run build:registry
```
