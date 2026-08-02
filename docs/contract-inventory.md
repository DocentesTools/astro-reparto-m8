# Reparto backend contract — re-verified inventory (Phase 0.5, step 1)

> Companion to the plan
> `.claude/plans/docentes/todo/reparto-admin-crud-plan-2026-07-06.md`
> (Phase 0.5 step 1: "Re-confirm exact paths/verbs/response shapes/
> delete-archive semantics/process-state constraints for all entities").
>
> Re-verified against `reparto-docente-m8` on **2026-07-06** from:
>
> - `reparto_service/app/main.py` (router wiring, prefix)
> - `reparto_service/app/routes/*.py` (path, verb, status code, query/body)
> - `reparto_service/db_models/*.py` (public response shape, create/update fields)
> - `reparto_service/enums.py` (status / type enum values)
>
> Status: **all paths, verbs, response shapes, delete-archive semantics and
> process-state constraints from plan §2 still match the backend**. The drift
> is zero. The only material additions versus the plan's §2 are listed in the
> **"Additional surface area not in plan §2"** section below — none of them
> invalidate the plan, but they do change the runtime's "to-be-modelled"
> list (which the plan already documents as "missing" for the same entities).
>
> The runtime is the consumer of this inventory: every public type and HTTP
> wrapper in `src/runtime/{schemas,api,queryKeys}.ts` MUST be a direct
> mirror of what is documented below. Any future change to the backend
> contract must be reflected here first, and the `tests/contract-fixtures/`
> fixtures (Phase 5 gate) must be updated at the same time.

---

## 1. Global entities (top-level routes)

### 1.1 School — `prefix=/schools`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `SchoolsPublic` (skip/limit query) | list | ✓ |
| Create | `POST /` → `201` `SchoolPublic` (writer role) | create | ✓ |
| Get | `GET /{school_id}` → `SchoolPublic` | get | ✓ |
| Patch | `PATCH /{school_id}` → `SchoolPublic` (writer role) | patch | ✓ |
| Delete | **not exposed** | no delete | ✓ |
| Create required | `name: str[1..200]` | `name*` | ✓ |
| Public shape | `id, name, locality, province, region, address, notes, created_at, updated_at` | (n/a) | ✓ |

Notes: edit-only. Backend has no `delete_school` route nor a soft-delete
column; UIs MUST surface edit only and never a delete affordance.

### 1.2 Academic year — `prefix=/academic-years`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `AcademicYearsPublic` (skip/limit query) | list | ✓ |
| Create | `POST /` → `201` `AcademicYearPublic` (writer role) | create | ✓ |
| Get | `GET /{year_id}` → `AcademicYearPublic` | get | ✓ |
| Patch | `PATCH /{year_id}` → `AcademicYearPublic` (writer role) | patch | ✓ |
| Archive | `POST /{year_id}/archive` → `AcademicYearPublic` (writer role) | `POST {id}/archive` | ✓ |
| Delete | **not exposed** | archive, not delete | ✓ |
| Create required | `label: str[1..20]`, `start_date: date`, `end_date: date` | `label*`, `start_date*`, `end_date*` | ✓ |
| Public shape | `id, label, start_date, end_date, status, previous_academic_year_id, school_id, created_by_user_id, created_at, updated_at` | (n/a) | ✓ |

Notes: dates are `YYYY-MM-DD` ISO date strings, not datetimes — UI MUST NOT
round-trip them through `new Date(...)` in local time (off-by-one risk). Status
enum: `active | archived`.

### 1.3 Department — `prefix=/departments`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `DepartmentsPublic` (school_id/skip/limit query) | list | ✓ |
| Create | `POST /` → `201` `DepartmentPublic` (writer role) | create | ✓ |
| Get | `GET /{department_id}` → `DepartmentPublic` | get | ✓ |
| Patch | `PATCH /{department_id}` → `DepartmentPublic` (writer role) | patch | ✓ |
| Delete | **not exposed** | no delete | ✓ |
| Create required | `school_id: uuid`, `name: str[1..150]` (`slug` auto-derived) | `school_id*`, `name*` (slug auto) | ✓ |
| Public shape | `id, school_id, name, slug, department_head_user_id, notes, created_at, updated_at` | (n/a) | ✓ |

Notes: uniqueness `(school_id, slug)` is DB-enforced. The Pydantic
`DepartmentGenerators` model auto-derives `slug` from `name` if missing, so
the runtime `DepartmentCreateSchema` should treat `slug` as optional.

### 1.4 Teacher profile (roster) — `prefix=/teacher-profiles`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `TeacherProfilesPublic` (active/skip/limit query) | list | ✓ |
| Create | `POST /` → `201` `TeacherProfilePublic` (writer role) | create | ✓ |
| Get | `GET /{profile_id}` → `TeacherProfilePublic` | get | ✓ |
| Patch | `PATCH /{profile_id}` → `TeacherProfilePublic` (writer role) | patch | ✓ |
| Link user | `POST /{profile_id}/link-user` body `{user_id: uuid}` → `TeacherProfilePublic` | `POST {id}/link-user` | ✓ |
| Delete | `DELETE /{profile_id}` → `TeacherProfilePublic` (writer role) | delete | ✓ |
| Create required | `display_name: str[1..150]` | `display_name*` | ✓ |
| Public shape | `id, display_name, user_id, active, notes, created_at, updated_at` | (n/a) | ✓ |

Notes: hard delete. `user_id` is the auth-service user id and is **optional**
at create (a teacher may exist before being bound to an account). `active` is
a free-form bool, not a status enum.

---

## 2. Process-scoped entities (`/assignment-processes/{process_id}/…`)

### 2.1 Assignment process — `prefix=/assignment-processes`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `AssignmentProcessesPublic` (academic_year_id/skip/limit) | list | ✓ |
| Create | `POST /` → `201` `AssignmentProcessPublic` (writer role) | create | ✓ |
| Get | `GET /{process_id}` → `AssignmentProcessPublic` | get | ✓ |
| Patch | `PATCH /{process_id}` → `AssignmentProcessPublic` (process writer) | patch | ✓ |
| Transition | `POST /{process_id}/transition` body `{target_status}` | transition | ✓ |
| Reopen | `POST /{process_id}/reopen` body `{reason: str[1..500]}` | reopen | ✓ |
| Copy-from | `POST /{process_id}/copy-from/{source_process_id}` body `{copy_assignments: bool=false}` | (not listed) | NEW §3.1 |
| Summary | `GET /{process_id}/summary` → `ProcessSummary` (reader floor) — `readiness`, `plan_status`, aggregate `plan_balance`, the three live-slot counts and `blocking_validation_count`; **names no teacher**, which is what makes it the shared-screen source | summary | ✓ |
| Dashboard | `GET /{process_id}/dashboard` → `ProcessDashboard` — `readiness` plus a `planning` section (`teaching_plan_id`, `status`, `PlanBalance`, `PlanValidationReport`, all nullable together when no plan exists) and an always-present `assignment` section (`AssignmentSummary` + `AssignmentValidationReport`). The two sections are reported side by side and are never summed | dashboard | ✓ |
| Shared screen source | the projected view calls **`/summary` only** — never `/dashboard` (`RBAC-07`); the aggregate carries no `display_name` and no per-participant hours | (n/a) | ✓ |
| LAN/me | `GET /{process_id}/lan/me` → `TeacherLanSummary` (reader floor) — `readiness`, `selection_blocked`, aggregate `plan_balance`, the caller's **own** `participant` balance and `available_slots` | lan/me | ✓ |
| Events (SSE) | `GET /{process_id}/events` → `text/event-stream` `event: process.summary` | events | ✓ |
| Create required | `academic_year_id, school_id, department_id` (all `uuid`) | `academic_year_id*`, `school_id*`, `department_id*` | ✓ |
| Public shape | base + `id, closed_at, closed_by_user_id, created_by_user_id, created_at, updated_at` | (n/a) | ✓ |
| Patch fields | `status, default_teacher_hours_reference, selection_order_enabled, selection_order_mode, direct_teacher_selection_enabled, lan_access_enabled` | (n/a) | ✓ |
| Delete | **not exposed** | patch/transition/reopen (no delete) | ✓ |

Process status enum (`AssignmentProcessStatus`, plan §8.4):

```text
draft, ready_for_meeting, meeting_open, assigning, department_proposal,
sent_to_school_leadership, returned_by_school_leadership, internal_revision,
final, reopened, archived
```

Transition validation is owned by the backend
(`reparto_service.services.process_lifecycle`); runtime MUST NOT re-implement
the state machine. UI surfaces a `<Select>` of legal transitions + an inline
reason input for `reopen`.

### 2.2 Subject — `prefix=/assignment-processes/{process_id}/subjects`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `SubjectsPublic` | list | ✓ |
| Create | `POST /` → `201` `SubjectPublic` (process writer) | create | ✓ |
| Get | `GET /{subject_id}` → `SubjectPublic` | get | ✓ |
| Patch | `PATCH /{subject_id}` → `SubjectPublic` (process writer) | patch | ✓ |
| Delete | `DELETE /{subject_id}` → `SubjectPublic` (process writer) | delete | ✓ |
| Create required | `name: str[1..150]` (process_id from URL) | `name*` | ✓ |
| Create optional | `allocation_category` (default `main`), `activity_type` (default `ordinary`), `default_group_weekly_hours: float>=0 \| null`, `default_teacher_weekly_hours_per_position: float>=0 \| null`, `default_required_teacher_count: int>=1` (default 1), `allows_multiple_groups: bool` (default false), `allows_zero_groups: bool` (default false), `notes` | (n/a) | ✓ |
| Public shape | `id, assignment_process_id, name, allocation_category, activity_type, default_group_weekly_hours, default_teacher_weekly_hours_per_position, default_required_teacher_count, allows_multiple_groups, allows_zero_groups, notes, created_at, updated_at` | (n/a) | ✓ |

> Re-verified **2026-07-30** against `reparto-docente-m8` branch
> `feat/reparto-three-stage-enums-lifecycle` (`db_models/subjects.py`,
> `app/routes/subjects.py`) for the three-stage adaptation (backend plan §5.3,
> §3.5, §20.17).

Notes: the two-stage `stage` column is **gone** — a runtime that still sends or
expects it fails the strict parse. `allocation_category` is
`main`/`secondary` (an extensible enum, never a boolean `is_main`) and
`activity_type` is `ordinary`/`tutoring`/`co_teaching`/`support`/
`department_level`/`other`, **descriptive only**: no behaviour may branch on it
(plan §20.17). The `default_*` fields are *suggestions* that seed new
`GroupSubject`/`TeachingActivity` rows; editing one never rewrites an
already-materialized row (plan §20.14). A `null` hour default means "no
suggestion", not zero. Hour defaults are serialized as JSON numbers today and
become canonical two-decimal strings after the backend's `NUMERIC(8, 2)` sweep
(plan §3.9) — the runtime reads both through `HoursSchema` and always **sends**
the canonical string. Uniqueness `(process_id, name)` is DB-enforced.

### 2.3 Teaching group (classroom) — `prefix=/…/groups`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `TeachingGroupsPublic` | list | ✓ |
| Create | `POST /` → `201` `TeachingGroupPublic` (process writer) | create | ✓ |
| Get | `GET /{group_id}` → `TeachingGroupPublic` | get | ✓ |
| Patch | `PATCH /{group_id}` → `TeachingGroupPublic` (process writer) | patch | ✓ |
| Delete | `DELETE /{group_id}` → `TeachingGroupPublic` (process writer) | delete | ✓ |
| Create required | `stage: str[1..50]`, `grade: int[0..20]`, `group_code: str[1..10]`, `label: str[1..100]` | matches plan | ✓ |
| Public shape | `id, assignment_process_id, stage, grade, group_code, label, notes, created_at, updated_at` | (n/a) | ✓ |

Notes: `label` is the human-readable name (e.g. "1 ESO A") and is unique per
process. UI auto-suggest label from `stage`/`grade`/`group_code`.

### 2.4 Requirement slot — `prefix=/…/requirements`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `HourRequirementsPublic` | list | ✓ |
| Get | `GET /{requirement_id}` → `HourRequirementPublic` | get | ✓ |
| Generate preview/apply | `POST /generation-preview`, `POST /generate` | three-stage §7.5 | ✓ |
| Reconcile preview/apply | `POST /reconciliation-preview`, `POST /reconcile` | three-stage §7.5/§9 | ✓ |
| Manual create/patch/delete | removed; generated slots are read-only | three-stage §5.9/§20.12 | ✓ |
| Public shape | `teaching_activity_id`, zero-based `position_index`, canonical `required_teacher_hours`, lifecycle `status`, generation lineage, timestamps | three-stage §5.9/§20.8 | ✓ |

Notes: one requirement is one complete, indivisible teacher-position slot.
`status` is `available`, `assigned`, `stale`, or `reconciliation_required`.
Identity and hours are changed only through deterministic generation or explicit,
reasoned reconciliation; the client exposes no manual mutation wrapper or hook.

### 2.5 Process teacher (participant) — `prefix=/…/teachers`

Re-verified 2026-08-02 against `reparto-docente-m8`
`reparto_service/app/routes/process_teachers.py` and
`db_models/process_teachers.py` on branch
`feat/reparto-three-stage-enums-lifecycle`.

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `ProcessTeachersPublic` | list | ✓ |
| Create | `POST /` → `201` `ProcessTeacherPublic` (admin) | create | ✓ |
| Get | `GET /{process_teacher_id}` → `ProcessTeacherPublic` | get | ✓ |
| Patch | `PATCH /{process_teacher_id}` → `ProcessTeacherPublic` (admin) — **no `extra_weekly_hours`** | patch | ✓ |
| Extra hours | `POST /{process_teacher_id}/extra-hours` body `{extra_weekly_hours, reason}` → `ProcessTeacherPublic` (admin) | three-stage §3.8/§7.6 | ✓ |
| Delete | `DELETE /{process_teacher_id}` → `ProcessTeacherPublic` (admin) | delete | ✓ |
| Create required | `teacher_profile_id: uuid`, `base_weekly_hours: float≥0` | three-stage §3.8 | ✓ |
| Public shape | base + `id, target_weekly_hours, is_overloaded, extra_hours_reason, extra_hours_updated_by_user_id, extra_hours_updated_at, created_at, updated_at` | three-stage §5.8 | ✓ |

Notes: a participant has an exact **target**, not an available capacity:
`target_weekly_hours = base_weekly_hours + extra_weekly_hours`, and both
computed fields are serialized by the service — the client reads them and never
recomputes the sum. `is_overloaded` is `extra_weekly_hours > 0`; it does **not**
mean assigned hours exceed the target, which the assignment gates prevent
outright (there is no override anywhere in the contract).

`extra_weekly_hours` is absent from `ProcessTeacherUpdate` on both sides:
authorized overload carries a mandatory reason and an audit event, so the
`/extra-hours` action is the only path, in either direction (withdrawing is the
same action with `0`). It **is** present on `ProcessTeacherCreate`, because the
backend's create schema carries the whole base field set; the default UI does
not offer it there, so a participant is created at their contractual base.

`status` enum: `active | inactive`. Uniqueness
`(process_id, teacher_profile_id)` is DB-enforced — UI surfaces a clear
"already a participant" error message on collision.

### 2.6 Assignment — `prefix=/…/assignments`

Re-verified 2026-08-02 against `reparto-docente-m8`
`reparto_service/app/routes/assignments.py`,
`controllers/assignments.py` and `db_models/assignments.py` on branch
`feat/auth-role-superuser-consistency`.

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `AssignmentsPublic` | list | ✓ |
| Create | `POST /` → `201` `AssignmentPublic` (admin) | create | ✓ |
| Direct choice | `POST /direct-choice` body `AssignmentDirectChoice` → `201` `AssignmentPublic` (writer, own participation) | direct-choice | ✓ |
| Validations | `GET /validations` → `AssignmentValidationReport` | three-stage §6.3/§6.4 | ✓ |
| Get | `GET /{assignment_id}` → `AssignmentPublic` | get | ✓ |
| Patch | `PATCH /{assignment_id}` → `AssignmentPublic` (admin) — **notes only** | patch | ✓ |
| Undo | `POST /{assignment_id}/undo` body `{reason}` → `AssignmentPublic` (admin) | three-stage §20.13 | ✓ |
| Reassign | `POST /{assignment_id}/reassign` body `{process_teacher_id, reason, notes?}` → `201` `AssignmentPublic` (admin) | three-stage §20.13 | ✓ |
| Delete | hidden, deprecated compatibility alias for `undo` and still reason-required; **no client wrapper** | three-stage §20.13 | ✓ |
| Create required | `hour_requirement_id, process_teacher_id` | matches plan | ✓ |
| Public shape | `id, assignment_process_id, hour_requirement_id, teaching_activity_id, process_teacher_id, source, status, chosen_by_user_id, confirmed_by_user_id, notes, created_at, updated_at` | three-stage §5.10/§20.9 | ✓ |

Notes: an assignment is one teacher occupying **one complete, indivisible
requirement slot in full**, so it carries no hours of its own — the hours are
the slot's `required_teacher_hours`. `source` enum: `department_head,
teacher_direct, imported_from_previous_year, system_copy`. `status` enum:
`active | cancelled`. `teaching_activity_id` is denormalised from the
requirement by the service (composite FK), never accepted from the client.

Service-enforced rules the client mirrors as pre-filters but never replaces:
one `ACTIVE` assignment per slot; a teacher never holds two `ACTIVE` positions
of the same activity (plan §3.7); the whole slot must fit the participant's
`target_weekly_hours` — an overload is authorized in advance through
`extra_weekly_hours`, never overridden at assignment time (plan §3.8);
assignment operations are refused while the plan is `STALE` or
`RECONCILIATION_REQUIRED`. Retired (`assigned_hours`, `assignment_type`,
`override_reason`, `overridden_by_user_id`, and the `draft`/`confirmed`/
`overridden` statuses): see the freeze §12 amendment table.

### 2.7 Meeting session — `prefix=/…/meeting-sessions`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `MeetingSessionsPublic` | list | ✓ |
| Create | `POST /` → `201` `MeetingSessionPublic` (process writer) | create | ✓ |
| Get | `GET /{meeting_session_id}` → `MeetingSessionPublic` | get | ✓ |
| Patch | `PATCH /{meeting_session_id}` → `MeetingSessionPublic` (process writer) | patch | ✓ |
| Close | `POST /{meeting_session_id}/close` → `MeetingSessionPublic` (process writer) | close | ✓ |
| Delete | **not exposed** | close (no delete) | ✓ |
| Create required | `assignment_process_id` (from URL) | (n/a) | ✓ |
| Public shape | base + `id, started_at, started_by_user_id, paused_at, closed_at, created_at, updated_at` | (n/a) | ✓ |

Notes: cross-field invariant — `direct_teacher_selection_enabled=true` is
rejected when `lan_access_enabled=false` (Pydantic validator on both
`Create` and `Update`). Status enum: `prepared, open, selecting, paused,
closed, reopened`.

### 2.8 Selection turn — `prefix=/…/meeting-sessions/{meeting_session_id}/turns`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `SelectionTurnsPublic` | list | ✓ |
| Initialize | `POST /initialize` → `SelectionTurnsPublic` (process writer) | initialize | ✓ |
| Start | `POST /{turn_id}/start` → `SelectionTurnPublic` (process writer) | start | ✓ |
| Complete | `POST /{turn_id}/complete` body `SelectionTurnComplete` → `SelectionTurnPublic` (process writer) | complete | ✓ |
| Skip | `POST /{turn_id}/skip` body `{reason}` → `SelectionTurnPublic` (process writer) | skip | ✓ |
| Override | `POST /{turn_id}/override` body `{reason}` → `SelectionTurnPublic` (process writer) | override | ✓ |
| Public shape | base + `id, started_at, completed_at, skipped_at, created_at, updated_at` | (n/a) | ✓ |

Notes: `complete` body `SelectionTurnComplete` carries the optional
`assignment: AssignmentCreate`. Status enum: `pending, active, completed,
skipped, overridden`.

### 2.9 Audit event — `prefix=/…/audit-events`

| Aspect | Verified value | Plan §2 | Match? |
| --- | --- | --- | --- |
| List | `GET /` → `AuditEventsPublic` | list only | ✓ |
| Create / patch / delete | **not exposed** | read-only | ✓ |
| Public shape | `id, assignment_process_id, actor_user_id, actor_role, event_type, entity_type, entity_id, before_json, after_json, reason, created_at, updated_at` | (n/a) | ✓ |

Notes: list-only by design (plan §8.14, post-MVP writer). UI must show
read-only rows with no row actions.

### 2.10 Allocation revision — `prefix=/…/allocation-revisions`

> Added **2026-07-30** for the three-stage adaptation (backend plan §5.1,
> §3.11, §7.1, §20.16). Verified against `reparto-docente-m8` branch
> `feat/reparto-three-stage-enums-lifecycle`:
> `app/routes/department_hour_allocation_revisions.py`,
> `controllers/department_hour_allocation_revisions.py`,
> `db_models/department_hour_allocation_revisions.py`.

| Aspect | Verified value |
| --- | --- |
| List | `GET /` → `DepartmentHourAllocationRevisionsPublic` (oldest revision first) |
| Current | `GET /current` → `DepartmentHourAllocationRevisionPublic`, **404** when the process has no allocation yet |
| Create | `POST /` → `201` `DepartmentHourAllocationRevisionPublic` (process writer) |
| Patch / delete | **not exposed** — revisions are immutable |
| Create required | `allocated_group_weekly_hours: float>0`, `reason: str[1..500]` |
| Create optional | `source` (default `manual_transcription`), `source_reference: str[..500]`, `received_at: datetime` |
| Public shape | create fields + `id, assignment_process_id, revision_number, created_by_user_id, superseded_at, created_at, updated_at` |

Notes: `source` enum: `manual_transcription, file_import, copied_draft,
other`. Exactly one revision per process is current (`superseded_at is
null`); creating one supersedes the previous revision transactionally,
increments the per-process `revision_number` and records an
`allocation.revised` audit event, so the reason is mandatory. A `final` or
`archived` process must be reopened before its allocation can change
(`400` otherwise). `allocated_group_weekly_hours` is serialized as a JSON
number today and becomes a canonical two-decimal string when the backend's
`NUMERIC(8, 2)` column sweep lands (backend plan §3.9) — the runtime reads
both through `HoursSchema` and always **sends** the canonical string.

### 2.11 Group subject — `prefix=/…/group-subjects`

> Added **2026-07-30** for the three-stage adaptation (backend plan §5.5, §7.2,
> §20.14). Verified against `reparto-docente-m8` branch
> `feat/reparto-three-stage-enums-lifecycle`: `app/routes/group_subjects.py`,
> `controllers/group_subjects.py`, `db_models/group_subjects.py`.

| Aspect | Verified value |
| --- | --- |
| List | `GET /` → `GroupSubjectsPublic` |
| Create | `POST /` → `201` `GroupSubjectPublic` (process writer) |
| Get | `GET /{group_subject_id}` → `GroupSubjectPublic` |
| Patch | `PATCH /{group_subject_id}` → `GroupSubjectPublic` (process writer) |
| Delete | `DELETE /{group_subject_id}` → `GroupSubjectPublic` (process writer) |
| Bulk preview | `POST /bulk-preview` → `GroupSubjectBulkPreview` (process writer, dry run) |
| Bulk apply | `POST /bulk-apply` → `GroupSubjectBulkResult` (process writer) |
| Create required | `assignment_process_id` (must equal the URL id), `teaching_group_id`, `subject_id` |
| Create optional | `group_weekly_hours: float>=0 \| null`, `teacher_weekly_hours_per_position: float>=0 \| null`, `required_teacher_count: int>=1` (default 1), `active: bool` (default true), `notes` |
| Patch fields | the create-optional set only — `teaching_group_id`/`subject_id` are immutable identity |
| Public shape | create fields + `id, created_at, updated_at` |

Notes: uniqueness `(assignment_process_id, teaching_group_id, subject_id)` is
DB-enforced (`400` on violation). A cross-process group or subject reference is
`404`; a payload `assignment_process_id` that disagrees with the URL is `400`; a
`final`/`archived` process is `400`. A `null` hour **inherits the subject
default** — it is not zero, and the two must never be collapsed in a form.

Bulk request body (shared by both bulk routes): `subject_id`, `mode`
(`create_missing`/`update_existing`/`upsert`), the optional selection filters
`stage: str \| null`, `minimum_grade: int>0 \| null`, `maximum_grade: int>0 \|
null`, and the optional set values `group_weekly_hours`,
`teacher_weekly_hours_per_position`, `required_teacher_count`. The set values
follow **`model_fields_set` semantics**: a field that is *absent* is not applied
(an update leaves it untouched, a create falls back to the default — `NULL`
hours, count 1), while an explicit `null` hour clears an override. Send
`required_teacher_count` only as a positive integer: the column is `NOT NULL`
and an explicit `null` would be applied verbatim.

`bulk-apply` additionally requires `expected_affected_count`, the count the
matching `bulk-preview` returned. Apply recomputes the plan and answers **409**
when it no longer matches (a changed selection can never be applied blindly),
**400** when `validation_errors` is non-empty (`minimum_grade` above
`maximum_grade` is the current case), and commits everything in one transaction
with a single `group_subject.bulk_applied` audit event.

Preview shape: `mode`, `subject_id`, `matched_group_ids`, `to_create`,
`to_update`, `unchanged` (each a change row of `teaching_group_id`,
`group_subject_id` — `null` for a row that does not exist yet — plus the three
resulting values), `conflicts` (`teaching_group_id` + `reason`; a matched group
`update_existing` cannot satisfy), `validation_errors` and
`expected_affected_count` (`len(to_create) + len(to_update)`). Result shape:
`created_count`, `updated_count`, `data` (the affected cells), `count`.

Frontend coverage: `useRepartoGroupSubjects`,
`usePreviewRepartoGroupSubjects` and `useApplyRepartoGroupSubjects` isolate the
HTTP calls and cache invalidation. `GroupSubjectBulkEditor` owns the default UI
surface: it maps blank hour inputs to explicit `null`, canonicalizes typed zero
to `"0.00"`, renders every preview outcome in a table, disables apply before a
valid preview, requires a separate confirmation and discards the preview on
409.

### 2.12 Teaching plan — `prefix=/…/teaching-plan`

> Added **2026-07-30** for the three-stage adaptation (backend plan §5.2,
> §6.1, §6.3, §7.3, §20.1). Verified against `reparto-docente-m8` branch
> `feat/reparto-three-stage-enums-lifecycle`: `app/routes/teaching_plans.py`,
> `controllers/teaching_plans.py`, `db_models/teaching_plans.py`,
> `schemas/planning.py`.

| Aspect | Verified value |
| --- | --- |
| Get | `GET ""` → `TeachingPlanPublic`; **404** while the process has no plan |
| Create | `POST ""` → `201` `TeachingPlanPublic` (process writer); no request body; **409** when a plan already exists |
| Summary | `GET /summary` → `PlanBalance` |
| Validations | `GET /validations` → `PlanValidationReport` |
| Lock | `POST /lock` → `TeachingPlanPublic` (admin); no request body; requires a balanced plan and a matching current feasible witness |
| Materialize main | `POST /materialize-main` → `MainMaterializationResult` (process writer); no request body; idempotent |
| Patch / delete | **not exposed** |
| Public shape | `id, assignment_process_id, allocation_revision_id, status, current_generation_number, locked_at, locked_by_user_id, requirements_generated_at, stale_reason, feasibility_status, feasibility_generation, feasibility_checked_at, feasibility_input_fingerprint, feasibility_solver_version, feasibility_diagnostics_ref, created_at, updated_at` |

Plan status values: `draft, unbalanced, balanced, locked,
requirements_generated, stale, reconciliation_required`. Feasibility is an
independent axis: `not_evaluated, feasible, infeasible, unknown`. The restricted
solver witness is deliberately absent from the browser contract.

`PlanBalance` contains `teaching_plan_id`, `assignment_process_id`, `group`,
`teacher`, and `is_exact`. The group axis is
`total_group_load, allocated_group_weekly_hours, allocation_difference,
is_balanced`; its target and difference are `null` until an allocation exists.
The teacher axis is `total_teacher_load, participant_target_total,
teacher_load_difference, is_balanced`. Computed hours are canonical
two-decimal strings and differences are signed; the two axes must never be
summed or collapsed.

`PlanValidationReport` contains `is_assignment_ready`, non-negative
`blocking_count` / `warning_count`, and messages of `severity, code, message,
entity_type, entity_id`. `code` is the stable machine key. Reading validations
does not trigger the feasibility solver.

### 2.13 Teaching activity — `prefix=/…/teaching-activities`

> Added **2026-07-30** for the three-stage adaptation (backend plan §5.6,
> §5.7, §7.4, §20.9–§20.11). Verified against
> `reparto-docente-m8` branch `feat/reparto-three-stage-enums-lifecycle`:
> `app/routes/teaching_activities.py`, `controllers/teaching_activities.py`,
> `db_models/teaching_activities.py`.

| Aspect | Verified value |
| --- | --- |
| List | `GET /` → `TeachingActivitiesPublic` |
| Create | `POST /` → `201` `TeachingActivityPublic` (process writer) |
| Get | `GET /{activity_id}` → `TeachingActivityPublic` |
| Patch | `PATCH /{activity_id}` → `TeachingActivityPublic` (process writer) |
| Delete | `DELETE /{activity_id}` → `TeachingActivityPublic` (process writer; retirement/downstream rules remain backend-authoritative) |
| Create required | `subject_id`, `group_weekly_hours_per_group: float>=0`, `teacher_weekly_hours_per_position: float>=0` |
| Create optional | `allocation_category` (default `secondary`), `activity_type` (default `ordinary`), `required_teacher_count: int>=1` (default 1), `notes`, `source` (only `secondary_manual` accepted), `group_subject_ids` (default empty) |
| Patch fields | `allocation_category, activity_type, group_weekly_hours_per_group, teacher_weekly_hours_per_position, required_teacher_count, notes, group_subject_ids` |
| Immutable identity | `subject_id, source, source_group_subject_id, teaching_plan_id` |
| Public shape | create values + `id, teaching_plan_id, source_group_subject_id, sync_state, retired_at, linked_group_count, created_at, updated_at` |

Source values: `main_generated, secondary_manual,
copied_from_previous_year, imported`. Sync values: `in_sync, out_of_sync`.
Retirement is represented by nullable `retired_at`, not a second generic status
enum. A main activity may carry `source_group_subject_id`; manual activities do
not. `group_subject_ids` is the complete unique link set and
`linked_group_count` must equal its length. Every link must belong to the
process and activity subject; subject flags decide whether zero or multiple
groups are allowed.

Activity entity hours are JSON numbers until the backend decimal-column sweep,
then canonical strings. `HoursSchema` accepts both on read and always normalizes
to a canonical string; create/update wrappers always send the exact canonical
string and reject a third decimal place rather than round user input.

### 2.14 Requirement generation — `prefix=/…/requirements`

> Added **2026-07-30** for the §13.2 plan-lock/generation workflow. Verified
> against `reparto-docente-m8` branch
> `feat/reparto-three-stage-enums-lifecycle`:
> `app/routes/hour_requirements.py`,
> `controllers/hour_requirements.py`, and
> `db_models/hour_requirements.py`.

| Aspect | Verified value |
| --- | --- |
| Preview | `POST /generation-preview` → `RequirementGenerationPreview`; dry-run, no request body |
| Apply | `POST /generate` → `RequirementGenerationResult`; no request body |
| Generatable status | `locked` or `stale`; other plan states return 400 |
| Conflict | Preview sets `requires_reconciliation`; apply refuses an assigned-slot change with 409 |
| Preview shape | `next_generation_number`, `to_create`, create/preserve/retire/conflict ids and counts, `requires_reconciliation`, `is_noop` |
| Apply shape | `generation_number`, `created`, created/preserved/retired counts, complete live `data`, authoritative live `count` |

A planned slot is `(teaching_activity_id, position_index,
required_teacher_hours)`. Applied rows additionally carry stable row identity,
process/activity ids, status, generation lineage, supersession identity and
timestamps. Hour fields accept the backend's current JSON numbers and future
decimal strings, then normalize to canonical two-place strings.

The live contract now exposes `POST /teaching-plan/lock`. The frontend shows
the service validation report first, requires a focused confirmation, and then
uses the returned `TeachingPlanPublic` as the authoritative lock result. The
backend still rejects a stale or non-feasible witness, and generation remains
disabled until the service reports `locked` or `stale`.

### 2.15 Allocation reconciliation — `prefix=/…/requirements`

> Added **2026-08-02** for the §13.2 allocation-change reconciliation workflow.
> Verified against `reparto-docente-m8` current branch:
> `app/routes/hour_requirements.py`, `controllers/hour_requirements.py`, and
> `db_models/hour_requirements.py`.

| Aspect | Verified value |
| --- | --- |
| Preview | `POST /reconciliation-preview` → `RequirementReconciliationPreview`; no request body |
| Apply | `POST /reconcile` with `reason` (1..1000) and `expected_conflict_count` → `RequirementReconciliationResult` |
| Reconcilable status | `stale` or `reconciliation_required`; other plan states return 400 |
| Stale confirmation | apply returns 409 when the conflict count no longer matches; the client must discard and rerun preview |
| Conflict shape | requirement/activity/position identity, `value_changed` or `removed`, current/new canonical hours, assignment/participant identity, optional replacement identity |
| Preview shape | next generation, ordered conflicts, create/preserve/retire/conflict counts, `requires_reconciliation`, `is_noop` |
| Result shape | generation, resolved conflicts, released assignment ids, created/preserved/retired counts, complete live `data`, authoritative live `count` |

Preview never changes a row. Apply is the explicit manual-resolution boundary:
it records the reason, soft-cancels only the listed assignments, retires the old
slots, creates replacements for hour changes, preserves audit history and moves
the plan back to `requirements_generated`. The browser validates every response
strictly and normalizes all conflict and slot hours to canonical two-place
strings.

---

## 3. Additional surface area not in plan §2

These endpoints are present in the backend but were **omitted from the
plan's §2 inventory** (probably because the plan was a high-level
scaffolding, not a verbatim mirror of the OpenAPI). They are part of the
runtime's contract surface and must be modelled in Phase 1+ work, but
they do not change any decision in the plan (architecture, naming,
i18n, fixtures, etc.).

### 3.1 Process lifecycle — `/assignment-processes/{process_id}/copy-from/{source_process_id}`

- Body: `ProcessCopyRequest { copy_assignments: bool = false }`
- Auth: process writer
- Response: `AssignmentProcessPublic`
- Use case: initialise a new process by copying structure (and optionally
  assignments) from a sibling in the same school. **Out of scope for the
  Phase 0.5 contract freeze**, but the runtime may expose a thin
  `assignmentProcesses.copyFrom` wrapper when the backlog item
  "Initialize process from previous academic year" (§11 backlog) is
  picked up.

### 3.2 Versions & exports — `/assignment-processes/{process_id}/{versions,exports,compare-previous-year,restore-draft}`

Endpoints (already partially modelled in `src/runtime/api/history.ts`):

- `GET /versions` → `ProcessVersionsPublic`
- `POST /versions` body `ProcessVersionCreate` → `ProcessVersionPublic`
- `GET /versions/{left_id}/compare/{right_id}` → `VersionComparison`
- `GET /compare-previous-year` → `VersionComparison`
- `GET /exports` → `ExportArtifactsPublic`
- `POST /exports` body `ExportArtifactCreate` → `ExportArtifactPublic`
- `POST /restore-draft` body `ExportBackupRestoreRequest` → `AssignmentProcessPublic`

These are **read-only surfaces** as far as the admin management console
goes — no new table needed beyond what `history.ts` already exposes; the
existing runtime handles them. The plan's §7 information architecture
lists `Versions` and `Exports` in the Process group; the inventory
above confirms both are reachable today.

**`VersionComparison` (three-stage, 2026-08-02).** The comparison payload was
rewritten with the snapshot it summarises (backend plan §10.2/§10.3). The float
`required_hours_delta` / `assigned_hours_delta` / `assignment_count_delta`
family is gone — there is no aggregate "required" axis (§3.1 has two
independent balances) and an assignment carries no hours of its own (§5.10).
What the service publishes now, all computed as `right − left`:

| Field | Type | Note |
| --- | --- | --- |
| `changed_sections` | `string[]` | snapshot section names; `allocation_revisions`, `teaching_plan`, `subjects`, `group_subjects`, `teaching_activities`, `requirements`, `teachers`. Parsed as `string[]`, not an enum, so a section added later still renders |
| `allocation_changed`, `group_hours_changed`, `teacher_load_changed`, `subject_category_changed`, `activity_added_or_removed`, `group_link_added_or_removed`, `teacher_position_count_changed`, `participant_target_changed`, `requirement_generation_changed` | `bool` | the nine §10.3 dimensions; a *set* comparison, so a flag can be true with a zero delta |
| `allocation_delta` | canonical signed hours, **nullable** | `null` when either side has no current allocation — "not comparable", never `0.00` |
| `group_load_delta`, `teacher_load_delta`, `participant_target_total_delta` | canonical signed hours | parsed through `SignedHoursSchema`; no hour value is a JSON number here |
| `generation_number_delta`, `teacher_count_delta`, `activity_count_delta`, `requirement_count_delta` | `int` | signed counts |

`GET /compare-previous-year` returns the same payload with the two **process**
ids in the `*_version_id` fields (it diffs live snapshots, not stored
versions) and answers **400** when the process has no
`created_from_process_id`. The runtime therefore gates that call on the
process detail rather than calling it speculatively.

Runtime surface: `src/runtime/api/history.ts` (unchanged paths),
`repartoKeys.versionComparison(processId, left, right)` /
`repartoKeys.previousYearComparison(processId)`, hooks
`useRepartoVersionComparison`, `useRepartoPreviousYearComparison`,
`useCreateRepartoVersion` and `useRepartoProcess`, and the view-state helpers
`buildVersionComparisonView` / `buildVersionSelectionState` /
`versionSectionLabelKey` in `src/runtime/ui/history.ts`.

### 3.2b Planning exchange — `/assignment-processes/{process_id}/exports/planning-*`

Added to the runtime **2026-08-02** with the export-center bullet (backend plan
§3.10, §7.8, §20.25). Three separate operations, not one with a mode parameter,
because the three make three different promises:

- `POST /exports/planning-draft` → `PlanningExportArtifact`
- `POST /exports/planning-provisional` → `PlanningExportArtifact`
- `POST /exports/planning-final` → `PlanningExportArtifact`
- `POST /imports/planning` — body `PlanningImportRequest` → `PlanningImportResult`
  (`planningExchange.importPlanning`, wrapped 2026-08-02)

Draft and provisional artifacts are produced whatever the balances say — an
inexact, unbalanced or stale plan may not withhold them (§3.10) — while the
final mode answers **400** while any blocking finding stands (§7.8). The
artifact is computed on demand and returned in the body; nothing is stored,
which is what separates it from the checksummed `ExportArtifact` documents of
§3.2.

| Field | Type | Note |
| --- | --- | --- |
| `mode` | `draft\|provisional\|final` | the strictness the artifact was produced under |
| `plan_status`, `generated_at`, `teaching_plan_id` | — | the plan the artifact describes |
| `is_exact` | `bool` | both balances equal their targets (§3.10) |
| `is_final_exportable` | `bool` | the service's own answer to "would the final mode succeed?"; read as reported, never recomputed from the finding list |
| `balance` | `PlanBalance` | both independent axes, always present whatever the mode |
| `validations` | `PlanValidationReport` | blocking/warning findings, always present |
| `activities` | `PlanningExportActivity[]` | per-activity group/teacher loads; every hour a canonical two-place string |

§20.25 additionally requires a provisional document to **print the feasibility
status**. The artifact does not carry it, so the UI prints it from
`TeachingPlanPublic.feasibility_status` beside the offer, and a process with no
plan renders `none` rather than `not_evaluated` — absent is not "evaluated to
nothing".

Runtime surface: `src/runtime/api/planningExchange.ts`
(`planningExchange.exportDraft` / `exportProvisional` / `exportFinal` and the
`planningExportRequest(mode)` selector plus `importPlanning`), hooks
`useCreateRepartoPlanningExport`, `useImportRepartoPlanning`,
`useCreateRepartoExportArtifact` and `useRestoreRepartoDraft`, and the view-state
helpers `buildExportCenterState` / `buildPlanningImportDraftState` in
`src/runtime/ui/history.ts`.
A planning export is a mutation with no invalidation: it changes nothing, and
caching it would show a plan that has since moved.

The import panel accepts only the strict `PlanningImportRequest` JSON contract.
It never disables import because the current or prospective plan is inexact;
after success it renders both returned balance axes and every service-owned
finding (including reconciliation work) with its stable code. Backup restore is
separate from planning import, uses the latest JSON backup, exposes the service's
`restore_assignments` mode, and requires a focused confirmation because the
target must be an empty draft.

### 3.3 Streaming summary — `GET /assignment-processes/{process_id}/events`

- Content-Type: `text/event-stream`
- Event name: `process.summary`
- Payload: a `ProcessSummary` object serialised as JSON in the `data:`
  line of the SSE frame
- Use case: push live summary updates to a shared dashboard while a
  meeting is open. Out of scope for Phase 0.5; the runtime may wrap it
  in Phase 4 (dashboards).

---

## 4. Process-state constraints (single source of truth = backend)

The runtime MUST NOT encode the state machine. What the UI is allowed to
do:

1. Fetch the current `status` from the `AssignmentProcessPublic` it
   already holds (no separate endpoint needed).
2. Offer only **legal transitions** in a `<Select>`. Legal transitions
   are validated server-side; the runtime asks the backend and surfaces
   the resulting `AssignmentProcessPublic` (re-fetch the detail
   endpoint after the mutation if the response does not include the new
   status — it does today).
3. For `reopen`, always require a `reason: str[1..500]` (Pydantic
   enforced). UI shows a non-empty `Textarea` and disables the
   submit button until the reason is filled in.
4. Disabled state for any transition the backend may reject is the
   correct behaviour: the UI surfaces a visible reason
   ("Process is in `final` state", "Permission required", etc.) and
   lets the backend error mapping handle 4xx responses.

Per-entity lifecycle states that are not the process itself (and whose
mutations are also server-validated): `MeetingSessionStatus`,
`SelectionTurnStatus`, `AssignmentStatus`, `ProcessTeacherStatus`,
`AcademicYearStatus`. Their enum values are listed inline in §2 above.

---

## 5. List-endpoint query-parameter matrix

The plan §5 mandates: "support pagination/search/filter params **only
where the backend accepts them**". Verified:

| Entity | Path | Pagination | Filter | Search |
| --- | --- | --- | --- | --- |
| Schools | `/schools/` | `skip, limit` | — | — |
| Academic years | `/academic-years/` | `skip, limit` | — | — |
| Departments | `/departments/` | `skip, limit` | `school_id: uuid?` | — |
| Teacher profiles | `/teacher-profiles/` | `skip, limit` | `active: bool?` | — |
| Assignment processes | `/assignment-processes/` | `skip, limit` | `academic_year_id: uuid?` | — |
| Subjects | `/…/subjects/` | — | — | — |
| Teaching groups | `/…/groups/` | — | — | — |
| Requirement slots | `/…/requirements/` | — | — | — |
| Process teachers | `/…/teachers/` | — | — | — |
| Assignments | `/…/assignments/` | — | — | — |
| Meeting sessions | `/…/meeting-sessions/` | — | — | — |
| Selection turns | `/…/turns/` | — | — | — |
| Audit events | `/…/audit-events/` | — | — | — |

The process-scoped lists (subjects, groups, requirements, teachers,
assignments, audit) accept **no** query parameters today, so the
runtime's list hooks stay compact client-side. The plan's instruction
"Do not invent query params" is honoured: table pages and search inputs
are filtered client-side from the full list until the backend adds
paging.

---

## 6. Required-body shape (verbatim — copy into Zod schemas)

These are the exact fields the runtime's `…CreateSchema` /
`…UpdateSchema` must mirror. Anything not listed MUST be `optional()` or
omitted; anything listed MUST be `required()`.

| Entity | Create (required) | Update (all optional) |
| --- | --- | --- |
| School | `name` | `name, locality, province, region, address, notes` |
| Academic year | `label, start_date, end_date` | `label, start_date, end_date, status, previous_academic_year_id, school_id` |
| Department | `school_id, name` (`slug` auto) | `name, slug, department_head_user_id, notes` |
| Teacher profile | `display_name` | `display_name, user_id, active, notes` |
| Assignment process | `academic_year_id, school_id, department_id` | `status, default_teacher_hours_reference, selection_order_enabled, selection_order_mode, direct_teacher_selection_enabled, lan_access_enabled` |
| Subject | `name` | `name, allocation_category, activity_type, default_group_weekly_hours, default_teacher_weekly_hours_per_position, default_required_teacher_count, allows_multiple_groups, allows_zero_groups, notes` |
| Group subject | `teaching_group_id, subject_id` (`assignment_process_id` from URL) | `group_weekly_hours, teacher_weekly_hours_per_position, required_teacher_count, active, notes` |
| Teaching group | `stage, grade, group_code, label` | `stage, grade, group_code, label, notes` |
| Requirement slot | — (generated from the teaching plan) | — (read-only; generation/reconciliation only) |
| Process teacher | `teacher_profile_id, base_weekly_hours` | `base_weekly_hours, participates_in_selection, selection_position, selection_points, selection_criteria_label, selection_notes, order_locked, status` (**never** `extra_weekly_hours` — see `POST /…/extra-hours`) |
| Assignment | `hour_requirement_id, process_teacher_id` | `notes` (undo and reassignment are their own reason-required actions) |
| Meeting session | *(none — `assignment_process_id` from URL)* | `status, lan_access_enabled, direct_teacher_selection_enabled, selection_mode, notes` |
| Selection turn | `meeting_session_id, process_teacher_id, position` (manual create rare; usually `initialize`) | `status, skip_reason, forced_by_user_id, notes` (mutation is via `start` / `complete` / `skip` / `override` actions) |
| Audit event | — | — (read-only) |

Special operations:

- `POST /academic-years/{id}/archive` — no body
- `POST /teacher-profiles/{id}/link-user` — body `{user_id}`
- `POST /assignment-processes/{id}/transition` — body `{target_status}`
- `POST /…/teachers/{process_teacher_id}/extra-hours` — body
  `{extra_weekly_hours, reason}`; the only path that changes authorized overload
- `POST /assignment-processes/{id}/reopen` — body `{reason: str[1..500]}`
- `POST /assignment-processes/{id}/copy-from/{src}` — body `{copy_assignments: bool=false}`
- `POST /…/meeting-sessions/{id}/close` — no body
- `POST /…/turns/initialize` — no body
- `POST /…/turns/{id}/start` — no body
- `POST /…/turns/{id}/complete` — body `SelectionTurnComplete { assignment?, notes? }`
- `POST /…/turns/{id}/skip` — body `SelectionTurnAction { reason, notes? }`
- `POST /…/turns/{id}/override` — body `SelectionTurnAction { reason, notes? }`
- `POST /…/assignments/direct-choice` — body `AssignmentDirectChoice { meeting_session_id, hour_requirement_id, notes? }`
- `POST /…/assignments/{id}/undo` — body `AssignmentUndo { reason: str[1..500] }`
- `POST /…/assignments/{id}/reassign` — body `AssignmentReassign { process_teacher_id, reason: str[1..500], notes? }`
- `POST /…/allocation-revisions/` — body `{allocated_group_weekly_hours, reason, source?, source_reference?, received_at?}`
- `POST /…/group-subjects/bulk-preview` — body `GroupSubjectBulkRequest { subject_id, mode, stage?, minimum_grade?, maximum_grade?, group_weekly_hours?, teacher_weekly_hours_per_position?, required_teacher_count? }`
- `POST /…/group-subjects/bulk-apply` — same body plus `expected_affected_count` (409 when stale)

---

## 7. Verification drift summary

| Plan §2 line | Verified? | Notes |
| --- | --- | --- |
| `School /schools list, create, get, patch / name* / no delete — edit only` | ✓ | matches |
| `Academic year /academic-years list, create, get, patch, POST {id}/archive / label*, start_date*, end_date* / archive, not delete` | ✓ | matches; dates are date-only strings |
| `Department /departments?school_id= list, create, get, patch / school_id*, name* (slug auto) / no delete — edit only` | ✓ | matches; slug is auto-derived |
| `Teacher profile (roster) /teacher-profiles?active= list, create, get, patch, POST {id}/link-user, delete / display_name* / hard delete (confirm)` | ✓ | matches; hard delete confirmed |
| `Assignment process /assignment-processes list, create, get, patch, transition, reopen, summary, dashboard, lan/me, events / academic_year_id*, school_id*, department_id* / patch/transition/reopen (no delete)` | ✓ + `copy-from` | extra `POST /copy-from/{src}` not in plan §2 — see §3.1 |
| `Subject /…/subjects list, create, get, patch, delete / name* / hard delete (confirm)` | ✓ | matches |
| `Teaching group (classroom) /…/groups list, create, get, patch, delete / stage*, grade*, group_code*, label* / hard delete (confirm)` | ✓ | matches |
| `Requirement slot /…/requirements list, get, generation-preview/generate, reconciliation-preview/reconcile / teaching_activity_id + position_index + required_teacher_hours / generated, never manually deleted` | ✓ | three-stage contract |
| `Process teacher (participant) /…/teachers list, create, get, patch, delete / teacher_profile_id*, base_weekly_hours* / hard delete (confirm)` | ✓ | matches; `(process_id, teacher_profile_id)` uniqueness; plus the audited `POST /…/extra-hours` |
| `Assignment /…/assignments list, create, direct-choice, get, patch, delete / hour_requirement_id*, process_teacher_id*, assigned_hours*, meeting_session_id* / hard delete (confirm)` | ✓ | matches; **note**: `meeting_session_id` is NOT a Create field in the backend — it is set when a teacher uses `direct-choice` and is left null on `POST /`. Plan §2 row should be read as "the direct-choice path carries `meeting_session_id`", not the create path |
| `Meeting session /…/meeting-sessions list, create, get, patch, close / — / close (no delete)` | ✓ | matches |
| `Selection turn /…/selection-turns list, initialize, start, complete, skip, override / — / state ops only` | ✓ | matches |
| `Audit event /…/audit-events list only / — / read-only` | ✓ | matches |

**Drift in interpretation** (worth a plan patch in a follow-up PR, not a
blocker for Phase 0.5):

- Plan §2 row "Assignment" lists `meeting_session_id*` under "Create
  required" — this is misleading. `AssignmentCreate` in the backend does
  not include `meeting_session_id`; the field is **only** set by
  `POST /…/assignments/direct-choice` (and even there it lives in
  `AssignmentDirectChoice`, not `AssignmentCreate`). The runtime
  `AssignmentCreateSchema` MUST NOT mark `meeting_session_id` as
  required.
- Plan §2 omits `POST /…/copy-from/{src}` and the entire
  `/{versions,exports,…}` subtree. These are already in `history.ts` and
  are not in scope for the CRUD work in Phase 1–3; the inventory here
  records them so the plan stays honest.

---

## 8. What Phase 1 picks up

This inventory is the direct input for Phase 1 of the plan
("runtime for global entities"). Concretely, Phase 1 will:

1. Add `src/runtime/schemas.ts` enum + entity families for:
   `AcademicYearStatus`, `AssignmentType`, `AssignmentSource`,
   `AssignmentStatus`, `ProcessTeacherStatus`, `MeetingSessionStatus`,
   `SelectionTurnStatus`, plus the eight entity families that are
   "missing" per plan §2.
2. Add `src/runtime/api/{schools,academicYears,departments,teacherProfiles}.ts`
   (one file per entity), all using the existing `request()` client and
   parsing responses with the matching `…PublicSchema`.
3. Add `src/runtime/api/{subjects,teachingGroups,hourRequirements,processTeachers,assignments,auditEvents}.ts`.
   The three-stage adaptation later narrowed `hourRequirements` to read plus
   generation/reconciliation; its former manual CRUD surface is intentionally gone.
4. Extend `src/runtime/queryKeys.ts` and `src/runtime/react/hooks.tsx` with the
   operations the live service owns. Generated requirements expose a list query
   and generation/reconciliation mutations, never row CRUD hooks.

This document is the contract those files must mirror. Any divergence
between this file and the running backend is a bug; a divergence
between this file and a future backend change is a documentation debt
that must be paid before the runtime catches up.
