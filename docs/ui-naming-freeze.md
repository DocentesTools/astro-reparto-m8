# Reparto UI naming freeze (Phase 0.5, step 2)

> Companion to the plan
> `.claude/plans/docentes/todo/reparto-admin-crud-plan-2026-07-06.md`
> (Phase 0.5 step 2: "Freeze UI naming (§3)").
>
> Goal: **one name per concept** across UI label, runtime name, backend
> path, and dictionary key. From now on, any new string in a skin or
> runtime module that does not appear in this freeze is a bug.

This freeze is the **single source of truth** the runtime dictionary
(`src/runtime/i18n/{en,fr,es}.ts` — to be added in Phase 1) and the
registry skins (Phase 1–3) must mirror.

---

## 1. Decision summary

| Decision | Rule | Why |
| --- | --- | --- |
| **English is canonical** | All `en` strings are the source. `fr`/`es` are translations of `en`, not parallel concepts. | Plan §4b (Architecture invariants). |
| **Camel-case runtime names** | `teacherProfiles`, `processTeachers`, `teachingGroups`, `academicYears`, `hourRequirements`, `auditEvents`, `assignmentProcesses`, `meetingSessions`, `selectionTurns`. | Mirrors Zod schema exports; no translation cost in code. |
| **UI labels are title-cased English, then translated** | `Teacher roster`, `Roster de profesorado` (es), `Liste du personnel enseignant` (fr). Title Case en; lower-case, sentence-case or article-led fr/es per locale convention (see §5). | Calm meeting-screen reading. |
| **i18n keys are flat-with-dots** | `entity.teacherRoster.singular`, `action.archive`, `error.required`. | Friction-free for hand-written dictionaries; no namespace conflict. |
| **Two "Teacher" concepts must never share a label** | Global = **Teacher roster**; process-scoped = **Process participants**. | Plan §3, frozen. |
| **"Classrooms" is the user-facing word for `teachingGroups`** | `groups` is internal slang; never appears in a UI string. | Plan §3. |
| **Academic year has an Archive action, not a Delete action** | The button is **Archive**; the verb is `archive`; the route is `POST /academic-years/{id}/archive`. | Plan §2 + backend has no `DELETE /academic-years/{id}`. |
| **Schools and Departments have only Edit (no Delete)** | The button is **Edit**; no `Delete` button is ever rendered. | Plan §2 + backend has no delete route for either. |
| **Audit events are read-only** | Tables show rows, no row actions, no Create button. | Plan §2. |
| **Destructive actions are visually separated** | The `Delete` action lives in a `<AlertDialog>` ("Delete …"); the `Archive` action uses different copy ("Archive … this year will no longer appear in active lists"). | Plan §4 meeting-readiness. |
| **Action labels are imperative verbs, sentence case** | `Create`, `Edit`, `Archive`, `Delete`, `Close`, `Reopen`, `Link user`, `Restore draft`, `Save changes`, `Cancel`. | Calm, unambiguous in a live meeting. |
| **Status labels are adjectives / past participles** | `Draft`, `Ready for meeting`, `Meeting open`, `Assigning`, `Department proposal`, `Sent to school leadership`, `Returned by school leadership`, `Internal revision`, `Final`, `Reopened`, `Archived`. (en) | Reads cleanly on a status pill. |
| **Error messages are one short sentence, in the active voice** | `Could not create the school. The name is required.`; `The academic year is already archived.` | Plan §4, "never swallow errors". |
| **No UUID string ever appears in a user-facing label or placeholder** | The only legitimate use of a UUID is in a `data-reparto-*` DOM attribute for tests; user input uses a `<Select>` populated from a list hook. | Plan §4 setup-flow requirement. |
| **Pluralization is the dictionary's job, not the skin's** | The skin always writes `"{count, plural, one {# school} other {# schools}}"`. `fr`/`es` supply their own plural rules. | Avoids `s/` rules in components. |

---

## 2. Canonical entity naming

| UI label (en) | UI label (fr) | UI label (es) | Runtime name | Backend path | Dictionary key root |
| --- | --- | --- | --- | --- | --- |
| School | Établissement | Centro | `schools` | `/schools` | `entity.school` |
| Academic year | Année scolaire | Curso académico | `academicYears` | `/academic-years` | `entity.academicYear` |
| Department | Département | Departamento | `departments` | `/departments` | `entity.department` |
| Teacher roster | Liste du personnel enseignant | Listado del profesorado | `teacherProfiles` | `/teacher-profiles` | `entity.teacherRoster` |
| Assignment process | Processus d'affectation | Proceso de reparto | `assignmentProcesses` | `/assignment-processes` | `entity.assignmentProcess` |
| Subject | Matière | Materia / Asignatura | `subjects` | `/…/subjects` | `entity.subject` |
| Classroom | Classe | Grupo / Aula | `teachingGroups` | `/…/groups` | `entity.classroom` |
| Requirement slot | Créneau de besoin | Puesto horario | `hourRequirements` | `/…/requirements` | `entity.hourRequirement` |
| Process participant | Participant au processus | Participante en el proceso | `processTeachers` | `/…/teachers` | `entity.processParticipant` |
| Assignment | Affectation | Reparto / Asignación | `assignments` | `/…/assignments` | `entity.assignment` |
| Meeting session | Séance | Sesión de reparto | `meetingSessions` | `/…/meeting-sessions` | `entity.meetingSession` |
| Selection turn | Tour de sélection | Turno de selección | `selectionTurns` | `/…/turns` | `entity.selectionTurn` |
| Audit event | Événement d'audit | Evento de auditoría | `auditEvents` | `/…/audit-events` | `entity.auditEvent` |
| Version | Version | Versión | `processVersions` | `/…/versions` | `entity.version` |
| Export artifact | Export | Exportación | `exportArtifacts` | `/…/exports` | `entity.exportArtifact` |

> **Sidebar entry policy**: the sidebar may **never** show two items
> both labelled "Teachers" — one is **Teacher roster** (global), the
> other is **Process participants** (per-process). The Spanish term for
> the second is **Participantes en el proceso** (not "Profesores del
> proceso" — the runtime `processTeachers` is a *participant* record,
> not a teacher record).

### 2.1 Pluralization roots

| Singular (en) | Plural (en) | Singular (fr) | Plural (fr) | Singular (es) | Plural (es) |
| --- | --- | --- | --- | --- | --- |
| School | Schools | Établissement | Établissements | Centro | Centros |
| Academic year | Academic years | Année scolaire | Années scolaires | Curso académico | Cursos académicos |
| Department | Departments | Département | Départements | Departamento | Departamentos |
| Teacher roster entry | Teacher roster entries | Enseignant | Enseignants | Docente | Docentes |
| Process | Processes | Processus | Processus | Proceso | Procesos |
| Subject | Subjects | Matière | Matières | Materia | Materias |
| Classroom | Classrooms | Classe | Classes | Grupo | Grupos |
| Requirement slot | Requirement slots | Créneau de besoin | Créneaux de besoin | Puesto horario | Puestos horarios |
| Process participant | Process participants | Participant | Participants | Participante | Participantes |
| Assignment | Assignments | Affectation | Affectations | Reparto | Repartos |
| Meeting session | Meeting sessions | Séance | Séances | Sesión | Sesiones |
| Selection turn | Selection turns | Tour de sélection | Tours de sélection | Turno de selección | Turnos de selección |
| Audit event | Audit events | Événement d'audit | Événements d'audit | Evento de auditoría | Eventos de auditoría |
| Version | Versions | Version | Versions | Versión | Versiones |
| Export artifact | Export artifacts | Export | Exports | Exportación | Exportaciones |

> **Note (es)**: "Materia" is the term used in Andalucía/Almería for
> "asignatura"; both are correct, but the fleet picks **Materia** as
> the canonical es label because the *reparto* ceremony is anchored in
> that vocabulary. "Asignatura" is allowed as a synonym in user-facing
> copy only when context demands it (e.g. "asignatura bilingüe" stays
> "asignatura").

---

## 3. Canonical field labels (per entity, by section)

Only fields that appear on **forms** or in **table columns** get a
label. Internal fields (audit `before_json`, `after_json`, `created_by`
ids, etc.) stay internal — no UI label.

### 3.1 School

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `name` | Name | Nom | Nombre | yes (form) | max 200 |
| `locality` | Locality | Commune | Localidad | no | |
| `province` | Province | Province | Provincia | no | |
| `region` | Region | Région | Comunidad autónoma | no | |
| `address` | Address | Adresse | Dirección | no | |
| `notes` | Notes | Notes | Notas | no | textarea |

### 3.2 Academic year

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | Label | Libellé | Etiqueta | yes | max 20; e.g. "2025-2026" |
| `start_date` | Start date | Date de début | Fecha de inicio | yes | `YYYY-MM-DD` string |
| `end_date` | End date | Date de fin | Fecha de fin | yes | `YYYY-MM-DD` string |
| `status` | Status | État | Estado | read-only (table) | enum `active` / `archived` |
| `previous_academic_year_id` | Previous academic year | Année scolaire précédente | Curso académico anterior | no | FK select |
| `school_id` | School | Établissement | Centro | no | FK select |

### 3.3 Department

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `school_id` | School | Établissement | Centro | yes (form) | FK select |
| `name` | Name | Nom | Nombre | yes | max 150 |
| `slug` | Slug | Slug | Slug | auto (form) | derived from name; read-only in edit form |
| `department_head_user_id` | Department head | Chef de département | Jefe de departamento | no | FK select (auth users) |
| `notes` | Notes | Notes | Notas | no | textarea |

### 3.4 Teacher roster

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `display_name` | Display name | Nom affiché | Nombre a mostrar | yes | max 150 |
| `user_id` | Linked user | Compte lié | Usuario vinculado | no | FK select (auth users) |
| `active` | Active | Actif | Activo | no | bool switch |
| `notes` | Notes | Notes | Notas | no | textarea |

### 3.5 Assignment process

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `academic_year_id` | Academic year | Année scolaire | Curso académico | yes (form) | FK select |
| `school_id` | School | Établissement | Centro | yes (form) | FK select |
| `department_id` | Department | Département | Departamento | yes (form) | FK select |
| `status` | Status | État | Estado | read-only (form) | enum (11 values) |
| `default_teacher_hours_reference` | Default hours reference | Heures de référence | Horas de referencia | no | number |
| `selection_order_enabled` | Selection order enabled | Ordre de sélection activé | Orden de selección activado | no | bool |
| `selection_order_mode` | Selection order mode | Mode d'ordre | Modo de orden | no | enum `none`/`informative`/`strict` |
| `direct_teacher_selection_enabled` | Direct teacher selection | Sélection directe par l'enseignant | Selección directa del docente | no | bool |
| `lan_access_enabled` | LAN access | Accès LAN | Acceso LAN | no | bool |

### 3.6 Subject

> Amended **2026-07-30** by the three-stage adaptation — see §12. `stage` is
> retired; the classification and planning-default fields below replace it.

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `name` | Name | Nom | Nombre | yes | max 150 |
| `allocation_category` | Allocation category | Catégorie d'attribution | Categoría de asignación | yes (defaulted) | enum `main`/`secondary`; never a boolean |
| `activity_type` | Activity type | Type d'activité | Tipo de actividad | yes (defaulted) | enum `ordinary`/`tutoring`/`co_teaching`/`support`/`department_level`/`other`; descriptive only |
| `default_group_weekly_hours` | Default group hours | Heures groupe par défaut | Horas de grupo por defecto | no | suggestion; empty = no suggestion, not 0 |
| `default_teacher_weekly_hours_per_position` | Default teacher hours per position | Heures enseignant par poste (défaut) | Horas por puesto por defecto | no | suggestion; empty = no suggestion, not 0 |
| `default_required_teacher_count` | Default teacher positions | Postes enseignants par défaut | Puestos docentes por defecto | yes (defaulted) | int ≥ 1 |
| `allows_multiple_groups` | Allows multiple groups | Plusieurs groupes autorisés | Permite varios grupos | no | bool |
| `allows_zero_groups` | Allows zero groups | Aucun groupe autorisé | Permite cero grupos | no | bool |
| `notes` | Notes | Notes | Notas | no | textarea |

### 3.7 Classroom (teaching group)

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `stage` | Stage | Niveau | Etapa | yes | free-form str, max 50 |
| `grade` | Grade | Niveau | Curso | yes | int 0..20 |
| `group_code` | Group code | Code de groupe | Código de grupo | yes | max 10 |
| `label` | Label | Libellé | Etiqueta | yes | max 100; e.g. "1 ESO A" |
| `notes` | Notes | Notes | Notas | no | textarea |

### 3.8 Generated requirement slot

> Replaced **2026-08-02** by the three-stage adaptation. This entity is generated
> and read-only; no create/edit/delete form exists.

| Field | en | fr | es | Surface | Notes |
| --- | --- | --- | --- | --- | --- |
| `teaching_activity_id` | Teaching activity | Activité d'enseignement | Actividad docente | activity group | resolved to subject + activity type; UUID is never visible copy |
| `position_index` | Position | Position | Posición | slot row | zero-based contract, displayed one-based |
| `required_teacher_hours` | Teacher hours | Heures enseignantes | Horas docentes | slot row | canonical two-decimal string; indivisible and read-only |
| `status` | Status | État | Estado | badge | `available`/`assigned`/`stale`/`reconciliation_required` |
| `created_generation` | Created generation | Génération de création | Generación de creación | lineage | read-only |
| `last_validated_generation` | Validated generation | Génération de validation | Generación de validación | lineage | read-only |

### 3.9 Process participant (process teacher)

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `teacher_profile_id` | Teacher | Enseignant | Docente | yes (form) | FK select from teacher roster |
| `base_weekly_hours` | Base hours | Heures de base | Horas base | yes | decimal hours ≥ 0; the only editable hour field |
| `extra_weekly_hours` | Authorized extra hours | Heures supplémentaires autorisées | Horas extra autorizadas | read-only (form) | changed only by the reasoned `extra-hours` action |
| `target_weekly_hours` | Target hours | Heures cibles | Horas objetivo | read-only | service-computed `base + extra` |
| `is_overloaded` | Authorized overload | Surcharge autorisée | Sobrecarga autorizada | read-only | `extra_weekly_hours > 0`; never "over-assigned" |
| `extra_hours_reason` | Reason | Motif | Motivo | yes (extra-hours action) | 1..500; shown read-only on the edit form |
| `participates_in_selection` | Participates in selection | Participe à la sélection | Participa en la selección | no | bool |
| `selection_position` | Selection position | Position | Posición | no | int |
| `selection_points` | Selection points | Points de sélection | Puntos de selección | no | number |
| `selection_criteria_label` | Selection criteria | Critère de sélection | Criterio de selección | no | str |
| `selection_notes` | Selection notes | Notes de sélection | Notas de selección | no | str |
| `order_locked` | Order locked | Ordre verrouillé | Orden bloqueado | no | bool |
| `status` | Status | État | Estado | read-only (table) | enum `active`/`inactive` |

Row actions: `edit` (base hours, selection flag, status), `extra-hours` (the
reasoned authorization) and `delete`. DOM slots:
`data-participant-overloaded`, `data-reparto-slot="participant-target"`,
`data-reparto-slot="participant-extra-hours"`,
`data-reparto-slot="participant-target-hours"`,
`data-reparto-slot="participant-overloaded"`,
`data-reparto-slot="participant-extra-hours-reason"`,
`data-reparto-form="participant-extra-hours"`,
`data-reparto-field="base-weekly-hours"`,
`data-reparto-field="extra-weekly-hours"`.

### 3.10 Assignment

One teacher occupying one complete, indivisible requirement slot. It carries no
hours, no share type and no override — see the §12 amendment table for the
names this replaced.

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `hour_requirement_id` | Requirement slot | Créneau de besoin | Puesto horario | yes (form) | free live-slot select; label carries the slot's own hours |
| `process_teacher_id` | Process participant | Participant | Participante | yes (form) | eligible-participant select |
| `teaching_activity_id` | — | — | — | read-only | denormalised by the service; drives the distinct-position rule, never labelled on its own |
| `source` | Source | Source | Origen | read-only | enum `department_head`/`teacher_direct`/`imported_from_previous_year`/`system_copy` |
| `status` | Status | État | Estado | read-only (table) | enum `active`/`cancelled` |
| `confirmed_by_user_id` | Confirmed by | Confirmé par | Confirmado por | read-only | FK user |
| `reason` | Reason | Motif | Motivo | yes (undo / reassign) | 1..500; the action cannot be taken without it |
| `notes` | Notes | Notes | Notas | no | textarea; the only editable field of a live assignment |

Board actions: `create` (assign), row `edit` (notes), row `reassign`, row
`undo`, and `undo-selected` over a table selection of **live rows only** — one
shared reason recorded on each, applied one at a time and stopped at the first
refusal. There is no row `delete` and no reasonless bulk cancellation. DOM slots: `data-reparto-slot="assignment-occupancy"`,
`data-reparto-slot="assignment-validations"`, `data-assignment-metric`,
`data-assignment-source`, `data-participant-disabled-reason`, `data-reparto-action="undo-selected"`,
`data-reparto-slot="ineligible-participants"`,
`data-reparto-slot="assignment-history"`.

### 3.11 Meeting session

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `status` | Status | État | Estado | read-only (table) | enum `prepared`/`open`/`selecting`/`paused`/`closed`/`reopened` |
| `lan_access_enabled` | LAN access | Accès LAN | Acceso LAN | no | bool |
| `direct_teacher_selection_enabled` | Direct teacher selection | Sélection directe | Selección directa | no | bool |
| `selection_mode` | Selection mode | Mode de sélection | Modo de selección | no | enum `none`/`informative`/`strict` |
| `notes` | Notes | Notes | Notas | no | textarea |

### 3.12 Selection turn

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position | Position | Posición | read-only (table) | int |
| `status` | Status | État | Estado | read-only (table) | enum `pending`/`active`/`completed`/`skipped`/`overridden` |
| `skip_reason` | Skip reason | Motif d'absence | Motivo de la ausencia | conditional | required when skipped |
| `forced_by_user_id` | Forced by | Forcé par | Forzado por | no | FK user |
| `notes` | Notes | Notes | Notas | no | textarea |

### 3.13 Group subject

> Added **2026-07-30** by the three-stage adaptation — see §12. One cell of the
> group-subject matrix (backend plan §5.5).

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `teaching_group_id` | Classroom | Classe | Grupo | yes (form) | FK select |
| `subject_id` | Subject | Matière | Materia | yes (form) | FK select |
| `group_weekly_hours` | Group hours | Heures groupe | Horas de grupo | no | empty **inherits the subject default**; `0` is a real zero |
| `teacher_weekly_hours_per_position` | Teacher hours per position | Heures enseignant par poste | Horas por puesto | no | empty inherits the subject default |
| `required_teacher_count` | Teacher positions | Postes enseignants | Puestos docentes | yes (defaulted) | int ≥ 1 |
| `active` | Active | Actif | Activa | no | bool; an inactive cell is not a planning candidate |
| `notes` | Notes | Notes | Notas | no | textarea |

The bulk editor added on 2026-07-30 freezes these surface slots:

| Concept | DOM slot | Contract |
| --- | --- | --- |
| Subject filter | `data-reparto-field="group-subject-subject"` | required FK select |
| Operation mode | `data-reparto-field="group-subject-mode"` | `create_missing` / `update_existing` / `upsert` |
| Stage filter | `data-reparto-field="group-subject-stage"` | optional backend stage value |
| Grade range | `data-reparto-field="group-subject-minimum-grade"` / `group-subject-maximum-grade` | optional positive integers; minimum must not exceed maximum |
| Actual group hours | `data-reparto-field="group-subject-group-hours"` | blank = inherit (`null`), typed `0` = `"0.00"` |
| Actual teacher hours | `data-reparto-field="group-subject-teacher-hours"` | blank = inherit (`null`), typed `0` = `"0.00"` |
| Teacher positions | `data-reparto-field="group-subject-teacher-count"` | positive integer, blank defaults to 1 |
| Preview | `data-reparto-table="group-subject-bulk-preview"` | create/update/unchanged/conflict rows |
| Apply confirmation | `data-reparto-dialog="group-subject-bulk-confirmation"` | separate confirmation after preview |
| Stale preview | `data-group-subject-bulk-stale` | 409 clears the preview and requires re-preview |

### 3.14 Secondary teaching activity

> Added **2026-07-30** by the three-stage adaptation. The activity type is
> descriptive only; behavior comes from the two hour values, teacher-position
> count, linked groups, and the selected subject's group-link policy.

| Field | en | fr | es | Required? | Notes |
| --- | --- | --- | --- | --- | --- |
| `subject_id` | Secondary subject | Matière secondaire | Materia secundaria | yes (create) | immutable on edit; only `SECONDARY` subjects are offered |
| `activity_type` | Activity type | Type d'activité | Tipo de actividad | yes | descriptive enum; never a behavior switch |
| `group_weekly_hours_per_group` | Group hours per group | Heures par groupe | Horas por grupo | yes | canonical two-place hours; counted once per linked group |
| `teacher_weekly_hours_per_position` | Teacher hours per position | Heures enseignant par poste | Horas por puesto docente | yes | canonical two-place hours; independent from group hours |
| `required_teacher_count` | Teacher positions | Postes enseignants | Puestos docentes | yes | positive integer; co-teaching commonly uses 2+ |
| `group_subject_ids` | Linked groups | Groupes liés | Grupos vinculados | subject policy | complete replacement set on edit; multi-group only when the subject allows it |
| `notes` | Notes | Notes | Notas | no | textarea, max 2000 |

The editor freezes these surface slots:

| Concept | DOM slot | Contract |
| --- | --- | --- |
| Editor | `data-reparto-component="secondary-activity-editor"` | package-owned planning panel |
| Activity list | `data-reparto-table="secondary-activities"` | live, non-retired secondary rows |
| Subject | `data-reparto-field="secondary-activity-subject"` | secondary-subject FK; disabled on edit |
| Descriptive type | `data-reparto-field="secondary-activity-type"` | ordinary/tutoring/co-teaching/support/department-level/other |
| Group hours | `data-reparto-field="secondary-activity-group-hours"` | required, decimal-safe, zero permitted |
| Teacher hours | `data-reparto-field="secondary-activity-teacher-hours"` | required, decimal-safe, zero permitted |
| Teacher positions | `data-reparto-field="secondary-activity-teacher-count"` | positive integer |
| Linked groups | `data-reparto-field="secondary-activity-groups"` | checkboxes over active same-subject `GroupSubject` cells |
| Notes | `data-reparto-field="secondary-activity-notes"` | optional textarea |
| Dialog | `data-reparto-dialog="secondary-activity-editor"` | create/edit surface |

### 3.15 Plan lock and requirement generation

> Added **2026-07-30** by the three-stage adaptation and completed
> **2026-08-02** against the feasibility-gated backend lock endpoint. Lock state
> remains service-owned; the mutation result or a subsequent plan read is the
> only source of a confirmed lock.

| Concept | DOM slot | Contract |
| --- | --- | --- |
| Workflow | `data-reparto-component="plan-lock-requirement-generation"` | package-owned planning panel |
| Validations | `data-reparto-slot="plan-lock-validations"` | service `PlanValidationReport`; stable code remains visible |
| Validation count | `data-plan-validation-count="blocking\|warning"` | non-negative authoritative counts |
| Lock status | `data-reparto-slot="plan-lock-confirmation"` | `data-plan-lock-confirmed` reflects server lifecycle state only |
| Lock review action | `data-reparto-action="review-plan-lock"` | enabled only for a balanced, feasible plan with zero blocking validations |
| Lock confirmation | `data-reparto-dialog="plan-lock-confirmation"` | focused confirmation after validations and before the backend mutation |
| Lock action | `data-reparto-action="lock-plan"` | `POST /teaching-plan/lock`; backend remains the final feasibility authority |
| Plan status | `data-teaching-plan-status` | raw service status; never a client-invented state |
| Preview action | `data-reparto-action="preview-requirement-generation"` | enabled only for `locked` or `stale` |
| Preview confirmation | `data-reparto-dialog="requirement-generation-confirmation"` | separate preview/apply boundary |
| Preview counts | `data-generation-preview-count="create\|preserve\|retire\|conflict"` | deterministic server diff |
| Apply action | `data-reparto-action="generate-requirements"` | disabled when reconciliation is required |
| Apply result | `data-reparto-slot="requirement-generation-result"` | server generation number and counts |
| Live-slot count | `data-generated-slot-count` | authoritative `RequirementGenerationResult.count` |

### 3.16 Allocation changes and reconciliation

> Added **2026-08-02** by the three-stage adaptation. Plan/reconciliation state
> remains service-owned; the UI never deletes an assignment or retries a stale
> confirmation silently.

| Concept | DOM slot | Contract |
| --- | --- | --- |
| Workflow | `data-reparto-component="allocation-change-reconciliation"` | package-owned planning panel |
| Reconciliation state | `data-reparto-slot="allocation-reconciliation-status"` | service plan status; `stale`/`reconciliation_required` enable preview |
| Preserved assignment notice | `data-reparto-state="assignments-preserved"` | assignments remain visible until explicit apply |
| Allocation history | `data-reparto-table="allocation-revisions"` | append-only immutable revisions |
| Allocation form | `data-reparto-form="allocation-revision"` | positive decimal hours, mandatory reason, source metadata |
| Record action | `data-reparto-action="create-allocation-revision"` | audited `POST /allocation-revisions/` |
| Preview action | `data-reparto-action="preview-requirement-reconciliation"` | `POST /requirements/reconciliation-preview` |
| Preview confirmation | `data-reparto-dialog="requirement-reconciliation-confirmation"` | reasoned manual-resolution boundary |
| Preview counts | `data-reconciliation-preview-count="create\|preserve\|retire\|conflict"` | deterministic affected-requirement diff |
| Conflict table | `data-reparto-table="reconciliation-conflicts"` | affected assigned requirements only |
| Manual action | `data-reparto-manual-action="release-and-replace\|release-and-retire"` | explicit service behavior, never a silent delete |
| Apply action | `data-reparto-action="reconcile-requirements"` | reason + exact expected conflict count |
| Apply result | `data-reparto-slot="requirement-reconciliation-result"` | released/resolved/generation counts |
| Live-slot count | `data-reconciled-live-slot-count` | authoritative result `count` |

### 3.17 Generated requirements view

> Added **2026-08-02** by the three-stage adaptation. The view is read-focused:
> it groups generated slots by teaching activity and position and exposes only
> service-owned lifecycle state. It has no row-selection or mutation controls.

| Concept | DOM slot | Contract |
| --- | --- | --- |
| Route view | `data-reparto-route="requirements"` | package-owned generated-slot view |
| Generation/reconciliation status | `data-reparto-slot="requirements-generation-status"` | service `TeachingPlan.status` and `current_generation_number` |
| Plan status | `data-teaching-plan-status` | raw service state, including `stale` / `reconciliation_required` |
| Summary metrics | `data-requirement-metric="activities\|slots\|available\|assigned\|attention"` | derived counts over the validated generated-slot response |
| Activity groups | `data-reparto-list="requirements-by-activity"` | one card per `teaching_activity_id`, labeled by subject + activity type |
| Position row | `data-requirement-position` | contract index remains zero-based; visible label is one-based |
| Slot lifecycle | `data-requirement-status` / `data-reparto-slot-status` | authoritative `HourRequirement.status` |
| Retirement lineage | `data-retired-generation` | service generation that retired the historical slot; replacement UUID is never visible copy |
| Empty state | `data-reparto-state="no-generated-requirements"` | no generated slot; no create affordance |

---

## 4. Canonical action verbs (button / link / menu labels)

The runtime dictionary exposes every action verb under `action.*` so
the same `Cancel` button in two dialogs renders the same word.

| Key | en | fr | es | Used in |
| --- | --- | --- | --- | --- |
| `action.create` | Create | Créer | Crear | Create buttons in tables/toolbars |
| `action.edit` | Edit | Modifier | Editar | Edit row action |
| `action.delete` | Delete | Supprimer | Eliminar | Destructive row action |
| `action.archive` | Archive | Archiver | Archivar | Academic year row action |
| `action.unarchive` | Unarchive | Désarchiver | Desarchivar | (future) |
| `action.close` | Close | Clore | Cerrar | Meeting session, process |
| `action.reopen` | Reopen | Rouvrir | Reabrir | Process |
| `action.transition` | Transition | Changer d'état | Cambiar de estado | Process status change |
| `action.save` | Save changes | Enregistrer | Guardar cambios | Form submit (idempotent) |
| `action.cancel` | Cancel | Annuler | Cancelar | Form cancel |
| `action.confirm` | Confirm | Confirmer | Confirmar | Generic confirm |
| `action.search` | Search | Rechercher | Buscar | Table search input placeholder |
| `action.filter` | Filter | Filtrer | Filtrar | Table filter |
| `action.refresh` | Refresh | Actualiser | Actualizar | Manual cache invalidate |
| `action.linkUser` | Link user | Lier un compte | Vincular usuario | Teacher roster row action |
| `action.unlinkUser` | Unlink user | Délier le compte | Desvincular usuario | (future) |
| `action.export` | Export | Exporter | Exportar | Versions / exports table |
| `action.restore` | Restore draft | Restaurer le brouillon | Restaurar borrador | History |
| `action.copyFrom` | Copy from previous year | Copier depuis l'année précédente | Copiar del curso anterior | Process row action |
| `action.startTurn` | Start turn | Démarrer le tour | Iniciar turno | Meeting turn |
| `action.completeTurn` | Complete turn | Terminer le tour | Completar turno | Meeting turn |
| `action.skipTurn` | Skip turn | Passer le tour | Saltar turno | Meeting turn |
| `action.overrideTurn` | Override turn | Forcer le tour | Forzar turno | Meeting turn |
| `action.initializeTurns` | Initialize turns | Initialiser les tours | Inicializar turnos | Meeting session |

### 4.1 Destructive confirmation copy

The `<AlertDialog>` **must** include the entity label and a reason
clause. The runtime dictionary exposes per-entity copy keys so the
destructive action is named explicitly:

| Key | en | fr | es |
| --- | --- | --- | --- |
| `confirm.delete.title` | Delete {entity}? | Supprimer {entity} ? | ¿Eliminar {entity}? |
| `confirm.delete.body` | This will permanently delete **{name}**. This action cannot be undone. | Cette action supprimera définitivement **{name}**. Elle est irréversible. | Esta acción eliminará permanentemente **{name}**. No se puede deshacer. |
| `confirm.archive.title` | Archive {entity}? | Archiver {entity} ? | ¿Archivar {entity}? |
| `confirm.archive.body` | **{name}** will no longer appear in active lists. Existing data is kept and can be reviewed from the archive view. | **{name}** ne figurera plus dans les listes actives. Les données existantes sont conservées et restent consultables depuis la vue archive. | **{name}** dejará de aparecer en las listas activas. Los datos existentes se conservan y pueden consultarse desde la vista de archivo. |
| `confirm.cancel` | Cancel | Annuler | Cancelar |
| `confirm.proceed` | Delete permanently | Supprimer définitivement | Eliminar permanentemente |
| `confirm.archiveProceed` | Archive | Archiver | Archivar |

`{entity}` and `{name}` are filled from the dictionary at render time
so a delete on a school renders "Delete **{school.name}**" in the
user's locale.

---

## 5. Pluralization, articles and gender rules

### 5.1 English

- Title Case for entity names in headings (`Teacher roster`).
- Sentence case for status and messages (`Meeting open`, `Could not
  create the school`).
- Plural: regular `+s`. Use ICU `plural` for counts.

### 5.2 French

- Title Case for entity names (`Liste du personnel enseignant`,
  `Année scolaire`).
- Sentence case for status and messages (`Séance ouverte`,
  `Impossible de créer l'année scolaire`).
- Plural: regular `+s` (with 5 exceptions: `journal → journaux`,
  `cheval → chevaux`, etc. — none in our dictionary, so default rule
  is safe). Use ICU `plural` for counts.
- **Article rule**: French uses articles aggressively. Sidebar item
  labels in fr use a definite article when the surface is unambiguous
  ("**La** réunion", "**Le** tableau de bord") but not when the
  surface is a list of heterogeneous items. The dictionary owns the
  choice; skins do not prepend articles.
- **Gender**: every noun carries a gender in the dictionary
  (`@gender` in a separate manifest consumed by future gender-aware
  copy). Today only the noun forms are needed.

### 5.3 Spanish

- Title Case for entity names (`Listado del profesorado`,
  `Curso académico`).
- Sentence case for status and messages (`Sesión abierta`,
  `No se pudo crear el centro`).
- Plural: regular `+s`; nouns ending in a vowel take `+s`, consonants
  take `+es` (`centro → centros`, `departamento → departamentos`,
  `sección → secciones`). The dictionary owns the plural form to
  avoid a per-component pluralizer.
- **Article rule**: the dictionary entry carries the full noun
  phrase; skins do not prepend articles.
- **Gender**: every noun carries a gender. The dictionary exposes a
  `@gender` manifest for future pronoun-aware copy. Today the nouns
  cover the current surface.

### 5.4 The "two teachers" rule (re-stated)

- **Teacher roster** (`teacherProfiles`): the permanent, school-wide
  list of teachers.
- **Process participants** (`processTeachers`): the per-process
  availability record, with hours and selection metadata.

The dictionary carries these as **two distinct roots**
(`entity.teacherRoster.*`, `entity.processParticipant.*`). A skin
**must not** introduce a `Teachers` key in `common.*` or anywhere
else. If a generic phrase is needed ("Teachers view", "Teacher
count"), the skin must ask the dictionary to choose explicitly via
`entity.teacherRoster.labelCount` or
`entity.processParticipant.labelCount`. A linter test
(`tests/i18n-no-bare-teachers.test.ts`, to be added in Phase 1) fails
on the bare key `common.teachers`.

---

## 6. Status labels (single source of truth)

These are the user-facing phrases for the enum values defined in
`docs/contract-inventory.md`. The dictionary owns the mapping; skins
never invent alternate status names.

| Enum (runtime) | en | fr | es |
| --- | --- | --- | --- |
| `draft` | Draft | Brouillon | Borrador |
| `ready_for_meeting` | Ready for meeting | Prêt pour la séance | Listo para la sesión |
| `meeting_open` | Meeting open | Séance ouverte | Sesión abierta |
| `assigning` | Assigning | Affectation en cours | Asignación en curso |
| `department_proposal` | Department proposal | Proposition du département | Propuesta del departamento |
| `sent_to_school_leadership` | Sent to school leadership | Envoyé à la direction | Enviado a la dirección |
| `returned_by_school_leadership` | Returned by school leadership | Renvoyé par la direction | Devuelto por la dirección |
| `internal_revision` | Internal revision | Révision interne | Revisión interna |
| `final` | Final | Final | Final |
| `reopened` | Reopened | Rouverte | Reabierto |
| `archived` | Archived | Archivé | Archivado |
| `active` | Active | Actif | Activo |
| `inactive` | Inactive | Inactif | Inactivo |
| `prepared` | Prepared | Préparé | Preparado |
| `open` | Open | Ouvert | Abierto |
| `selecting` | Selecting | Sélection en cours | Seleccionando |
| `paused` | Paused | En pause | En pausa |
| `closed` | Closed | Clos | Cerrado |
| `pending` | Pending | En attente | Pendiente |
| `completed` | Completed | Terminé | Completado |
| `skipped` | Skipped | Passé | Saltado |
| `overridden` | Overridden | Forcé | Forzado |
| `confirmed` | Confirmed | Confirmé | Confirmado |
| `cancelled` | Cancelled | Annulé | Cancelado |
| `balanced` | Balanced | Équilibré | Equilibrado |
| `pending` (state) | Pending | En attente | Pendiente |
| `exceeded` | Exceeded | Dépassé | Superado |
| `warning` | Warning | Avertissement | Aviso |
| `overloaded` | Overloaded | Surchargé | Sobrecargado |
| `not_participating` | Not participating | Ne participe pas | No participa |

---

## 7. Sidebar / information architecture labels

Plan §7 IA is the source of truth. The dictionary root is `nav.*`:

| Key | en | fr | es |
| --- | --- | --- | --- |
| `nav.group.setup` | Setup | Configuration | Configuración |
| `nav.group.process` | Process | Processus | Proceso |
| `nav.item.schools` | Schools | Établissements | Centros |
| `nav.item.academicYears` | Academic years | Années scolaires | Cursos académicos |
| `nav.item.departments` | Departments | Départements | Departamentos |
| `nav.item.teacherRoster` | Teacher roster | Liste du personnel enseignant | Listado del profesorado |
| `nav.item.dashboard` | Dashboard | Tableau de bord | Panel |
| `nav.item.processes` | Processes | Processus | Procesos |
| `nav.item.classrooms` | Classrooms | Classes | Grupos |
| `nav.item.subjects` | Subjects | Matières | Materias |
| `nav.item.requirements` | Requirements | Besoins horaires | Horas necesarias |
| `nav.item.processParticipants` | Process participants | Participants au processus | Participantes en el proceso |
| `nav.item.assignments` | Assignments | Affectations | Repartos |
| `nav.item.meeting` | Meeting | Séance | Sesión |
| `nav.item.myView` | My view | Mon espace | Mi vista |
| `nav.item.shared` | Shared screen | Écran partagé | Pantalla compartida |
| `nav.item.versions` | Versions | Versions | Versiones |
| `nav.item.exports` | Exports | Exports | Exportaciones |
| `nav.item.audit` | Audit | Audit | Auditoría |

---

## 8. Setup-checklist card (plan §4 requirement)

The setup-checklist card is shown on `/reparto` when no process
exists. Each step links to its create flow. Dictionary root:
`flow.bootstrap.*`.

| Key | en | fr | es |
| --- | --- | --- | --- |
| `flow.bootstrap.title` | Set up your reparto | Configurer votre répartition | Configurar el reparto |
| `flow.bootstrap.subtitle` | A few steps before you can run the meeting. | Quelques étapes avant de pouvoir tenir la séance. | Algunos pasos antes de iniciar la sesión. |
| `flow.bootstrap.step.school` | Create a school | Créer un établissement | Crear un centro |
| `flow.bootstrap.step.academicYear` | Create an academic year | Créer une année scolaire | Crear un curso académico |
| `flow.bootstrap.step.department` | Create a department | Créer un département | Crear un departamento |
| `flow.bootstrap.step.process` | Create a process | Créer un processus | Crear un proceso |
| `flow.bootstrap.step.subjects` | Add subjects | Ajouter des matières | Añadir materias |
| `flow.bootstrap.step.classrooms` | Add classrooms | Ajouter des classes | Añadir grupos |
| `flow.bootstrap.step.teacherRoster` | Add teachers | Ajouter des enseignants | Añadir docentes |
| `flow.bootstrap.step.requirements` | Generate requirement slots | Générer les créneaux de besoin | Generar puestos horarios |
| `flow.bootstrap.step.participants` | Add process participants | Ajouter des participants | Añadir participantes |
| `flow.bootstrap.done` | Done | Terminé | Hecho |
| `flow.bootstrap.open` | Open | Ouvrir | Abrir |

---

## 9. Validation & error message templates

The dictionary owns every validation message. Skins call
`formatMessage(key, vars)` and never interpolate by hand.

### 9.1 Required-field messages

| Key | en | fr | es |
| --- | --- | --- | --- |
| `error.required` | This field is required. | Ce champ est obligatoire. | Este campo es obligatorio. |
| `error.requiredNamed` | {field} is required. | {field} est obligatoire. | {field} es obligatorio. |

### 9.2 Backend error mapping

The runtime maps backend 4xx responses to a small set of
user-readable messages:

| Key | en | fr | es |
| --- | --- | --- | --- |
| `error.duplicate` | An entry with this name already exists. | Une entrée portant ce nom existe déjà. | Ya existe un registro con este nombre. |
| `error.duplicateScoped` | An entry with this name already exists in {scope}. | Une entrée portant ce nom existe déjà dans {scope}. | Ya existe un registro con este nombre en {scope}. |
| `error.fkMissing` | The selected {field} no longer exists. Please pick another. | Le {field} sélectionné n'existe plus. Veuillez en choisir un autre. | El {field} seleccionado ya no existe. Elija otro. |
| `error.fkViolation` | Cannot delete: {count} item(s) still depend on this entry. | Suppression impossible : {count} élément(s) dépendent encore de cette entrée. | No se puede eliminar: {count} elemento(s) siguen dependiendo de este registro. |
| `error.hoursInvalid` | Hours must be a positive number. | Les heures doivent être un nombre positif. | Las horas deben ser un número positivo. |
| `error.hoursExceed` | Total assigned hours ({assigned}) exceed required hours ({required}). Provide an override reason. | Le total des heures affectées ({assigned}) dépasse les heures requises ({required}). Indiquez un motif de dérogation. | Las horas asignadas ({assigned}) superan las horas necesarias ({required}). Indique un motivo de excepción. |
| `error.processState` | The process is in {status}; this action is not allowed in that state. | Le processus est en {status} ; cette action n'est pas autorisée dans cet état. | El proceso está en {status}; esta acción no está permitida en ese estado. |
| `error.permission` | You do not have permission to perform this action. | Vous n'avez pas les droits nécessaires pour effectuer cette action. | No tiene permiso para realizar esta acción. |
| `error.unauthorized` | Your session has expired. Please sign in again. | Votre session a expiré. Veuillez vous reconnecter. | Su sesión ha caducado. Inicie sesión de nuevo. |
| `error.network` | The server is unreachable. Please retry. | Le serveur est injoignable. Veuillez réessayer. | No se puede contactar con el servidor. Inténtelo de nuevo. |
| `error.server` | Something went wrong on our side. Please retry. | Une erreur est survenue de notre côté. Veuillez réessayer. | Se ha producido un error en el servidor. Inténtelo de nuevo. |

### 9.3 Disabled-reason templates

Every disabled button ships a tooltip (plan §4: "Every disabled
action must expose a visible reason"). Dictionary root: `disabled.*`.

| Key | en | fr | es |
| --- | --- | --- | --- |
| `disabled.noProcess` | Select or create a process first. | Sélectionnez ou créez d'abord un processus. | Seleccione o cree primero un proceso. |
| `disabled.processClosed` | The process is in {status}; this action is disabled. | Le processus est en {status} ; cette action est désactivée. | El proceso está en {status}; esta acción está desactivada. |
| `disabled.missingPrereq` | Create the {prereq} first. | Créez d'abord le {prereq}. | Cree primero el {prereq}. |
| `disabled.invalidHours` | Hours are invalid. | Les heures ne sont pas valides. | Las horas no son válidas. |
| `disabled.noData` | No data available yet. | Pas encore de données disponibles. | Aún no hay datos disponibles. |
| `disabled.noPermission` | You do not have permission. | Vous n'avez pas les droits nécessaires. | No tiene permiso. |

---

## 10. Conventions to enforce (tests will check these in Phase 1)

1. Every i18n key used in a skin must exist in `en`, `fr`, **and** `es`
   before the skin is merged. A `tests/i18n-completeness.test.ts`
   test fails on missing keys.
2. The bare key `common.teachers` (and any plural thereof) is
   forbidden. A lint test fails on the regex
   `/i18n(\.t|\(.*["'`])[^"'`]*teachers["'`]/i` outside the
   `entity.teacherRoster` / `entity.processParticipant` namespaces.
3. `UUID` strings never appear in a default value, placeholder, or
   aria-label. A render test scans default-ui and registry skins for
   `\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b`
   and fails on hit (the inventory doc and this freeze are exempt).
4. Status enums render from `entity.<entity>.status.<value>`, never
   from inline `if (status === "draft") ...`. A test fails on inline
   status strings.
5. Confirm dialogs include the entity label and the record's
   identifying name; a test walks the registry skins and asserts
   the `confirm.delete.*` keys are wired.

---

## 11. Phase 1+ dependency

The runtime dictionary lives at
`src/runtime/i18n/{en,fr,es}.ts` (added in Phase 1, see plan §4). It
MUST mirror every key listed above. The registry skins receive
`labels` / `locale` props and never hardcode a user-facing string.
Host overrides remain possible but plugin defaults are complete.

If a new entity, field, or action appears in a later phase, the
freeze must be updated **first** (this file is edited, PR'd, and
merged) and only then can the runtime dictionary grow.

---

## 12. Three-stage adaptation amendments (2026-07-30 →)

The three-stage adaptation deletes concepts this freeze named. **A frozen name
whose concept no longer exists is retired here explicitly, never silently
renamed** — a reader of an older skin must be able to find out what happened to
a name rather than find it quietly reused for something else.

Amendment rules:

1. A retired name is listed in the table below with what replaced it. It is
   removed from its §3 table in the same change, and that table gains a pointer
   to this section.
2. A retired `data-reparto-*` / `data-<entity>-*` DOM slot is **not** reused for
   a different concept. New concepts get new slot names.
3. Labels for a new surface land with the UI that renders them, not ahead of it
   — the i18n suite requires `en`/`fr`/`es` parity, so a key with no view is a
   translation nobody has reviewed in context.

| Retired | Where it was | Replaced by | Landed |
| --- | --- | --- | --- |
| `Subject.stage` (field + label + `data-subject-stage` row slot + list filter) | §3.6 | `allocation_category` (`data-subject-allocation-category`) and `activity_type` (`data-subject-activity-type`); the subject list filters on allocation category | 2026-07-30 |
| `HourRequirement.teaching_group_id` / `subject_id` / `required_hours` / `requirement_type` / `flags` / `notes`, manual CRUD dialogs, selection and `data-requirement-type` / `data-requirement-hours` | §3.8 | generated `teaching_activity_id` + `position_index` + `required_teacher_hours` + generation lineage; read-only activity/position groups in §3.17 | 2026-08-02 |
| `Assignment.assigned_hours` / `assignment_type` / `override_reason` / `overridden_by_user_id`, the `draft`/`confirmed`/`overridden` statuses, the assignment row `delete` action, the whole `assignmentSelection.*` bulk-delete surface and `error.hoursExceed` | §3.10 | the slot's own `required_teacher_hours` shown read-only; `status` `active`/`cancelled`; reason-required `undo` and `reassign` actions; an over-target assignment is prevented, not overridden (authorize `extra_weekly_hours` first) | 2026-08-02 |
| `view.choice.impact` — "{n} hours will be assigned to you", plus `meetingClosed`/`directDisabled`/`otherTurn`/`covered`/`alreadyCovered`/`turnChanged` and the `data-reparto-impact-hours` DOM slot | §3.10 / teacher LAN panel | one position taken whole: `view.choice.disabled.<code>` and `view.choice.conflict.<code>` keyed off stable codes, per-position `data-reparto-slot-choice` / `data-slot-disabled-reason`, panel-level `data-reparto-choice-reason` and `data-reparto-selectable-slots` | 2026-08-02 |
| `ProcessTeacher.available_hours` (field + `field.availableHours` label + the participants add/edit hour input + the `available_hours` list column + the `availableHours` error-mapping key) | §3.9 | `base_weekly_hours` (editable), `extra_weekly_hours` (audited action only), computed `target_weekly_hours` and `is_overloaded`; error keys `baseWeeklyHours` / `extraWeeklyHours` | 2026-08-02 |
| `TeacherLanSummary.global_balance` / `teacher_balance` / `blocking_validation_count` and the `data-reparto-slot="teacher-available-hours"` / `teacher-balance` slots | teacher LAN view | `readiness`, `selection_blocked`, aggregate `plan_balance`, the caller's own `participant` (`ParticipantBalance`) and `available_slots`; slots `teacher-base-hours`, `teacher-extra-hours`, `teacher-target-hours`, `teacher-assigned-hours`, `teacher-remaining-hours`, `teacher-overload`, `teacher-state`, `available-slots`, `lan-plan-balance` | 2026-08-02 |
| `ProcessSummary.global_balance` / `validations` and `ProcessDashboard.global_balance` / `teacher_balances` / `requirement_balances` / `validations` (with `GlobalBalance`, `TeacherBalance`, `RequirementBalance`, `ValidationMessage` and the `GlobalBalanceState` / `TeacherBalanceState` enums), plus the `overview-chart` / `teacher-load-chart` / `classroom-coverage-chart` panels and the `total-required-hours`, `pending-required-hours`, `overview-state`, `balance-summary`, `requirement-count`, `teacher-count`, `teacher-summary`, `coverage-summary`, `validation-count` slots, `data-reparto-chart-value` / `data-reparto-chart-bar`, and the whole `validation.*` dictionary branch | dashboard / shared screen | `ProcessSummary` (`readiness`, `plan_status`, `plan_balance`, `total_slots`/`assigned_slots`/`available_slots`) and `ProcessDashboard` (`readiness` + `planning`/`assignment` sections). Panels `planning-balance`, `assignment-progress`, `participant-balances`; slots `plan-status`, `planning-empty`, `total-slots`, `assigned-slots`, `available-slots`, `slot-progress`, `total-target-hours`, `total-assigned-hours`, `total-remaining-hours`, `participant-balances`, `participant-hours`, `participant-count`, `participant-summary`, `blocking-count`, `planning-validations`, `assignment-validations`, `validation-summary`; the three invariants as `data-reparto-invariant` / `data-reparto-invariant-state` and never one badge; both axes as `data-reparto-balance-axis`; findings printed from the service's own `message` with `data-reparto-validation-code` | 2026-08-02 |

Nothing from the single-balance family is left to retire: the dashboard bullet
took `ProcessSummary` and `ProcessDashboard` with it, and the LAN bullet had
already taken `TeacherLanSummary`. What the shared screen still renders under a
retired *panel* name (`global-state`, `turn-state`) is carried through to the
new payload and is the meeting-control / shared-screen bullet's to rename.
