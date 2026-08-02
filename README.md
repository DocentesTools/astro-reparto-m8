# @mano8/astro-reparto-m8

![CI/CD](https://github.com/DocentesTools/astro-reparto-m8/actions/workflows/CI.yaml/badge.svg?branch=main)

Astro integration and headless client for `reparto-docente-m8`.

## Classroom stages and bulk classrooms

The plugin exposes global classroom-stage schemas, API helpers, React Query
hooks, and the `/reparto/setup/classroom-stages` starter route. Stage reads are
available to authenticated users; mutation controls and the management route
use the auth adapter's existing `admin`/`superadmin` capability while the
backend remains authoritative.

Classroom forms submit `classroom_stage_id`, constrain grade to the selected
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

`GroupSubjectBulkEditor` is exported from
`@mano8/astro-reparto-m8/default-ui`. It loads the process subjects and
classrooms through the package hooks, exposes the three backend modes and the
stage/grade filters, and renders the complete create/update/unchanged/conflict
preview before enabling apply. Apply is a separate confirmation step. A 409
clears the preview and requires a fresh preview; the component never retries a
stale selection.

## Teaching plans and activities

`teachingPlans` wraps the process's single intermediate plan: get/create, the
dual planning summary, structured validations, feasibility-gated locking, and
idempotent main-activity materialization. Plan lifecycle status and assignment
feasibility remain separate axes. The summary likewise keeps group teaching
hours and teacher workload independent; signed differences are canonical
decimal strings, and the validation report exposes stable codes plus entity
references rather than requiring consumers to parse display text.

`teachingActivities` exposes the live activity list and CRUD contract. An
activity carries its complete planning values, source and sync state,
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

`AllocationChangeReconciliation` supplies that explicit reconciliation surface
and is mounted by `/planning`. Department heads can record an immutable,
reasoned allocation revision; history remains visible while the service marks
the plan stale and blocks new assignments. The reconciliation preview keeps
unchanged requirements and existing assignments visible, identifies each
affected assigned position and shows the manual release/replace or
release/retire action. Apply requires a reason plus the preview's exact conflict
count. A 409 discards the stale preview instead of retrying, and the result shows
released assignments, generation counts and the authoritative live-slot count.

The package follows the `astro-prompt-m8` plugin structure: typed Zod schemas,
API wrappers, auth adapter, optional starter routes, and explicit package
exports. Official M8 usage requires `@mano8/astro-auth-m8` because the backend
accepts `fa-auth-m8` tokens.

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
