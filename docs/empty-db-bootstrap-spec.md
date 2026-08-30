# Empty-DB bootstrap acceptance test (Phase 0.5, step 3)

> Companion to the plan
> `.claude/plans/docentes/todo/reparto-admin-crud-plan-2026-07-06.md`
> (Phase 0.5 step 3: "Define the empty-DB bootstrap acceptance test
> as a gate for Phases 1–2").
>
> This is the **gate definition** for Phases 1 and 2. It is the
> single criterion that decides whether the new admin management
> console can carry a real user from a brand-new database to a
> runnable proceso de reparto.
>
> Phases 1 and 2 are not "done" until this gate is green.

---

## 1. Why this gate exists

The current `ProcessPicker` (`src/runtime/react/default-ui/index.tsx`,
line 88) hard-codes **three raw UUID inputs** to create a process.
A user starting from an empty backend cannot obtain those UUIDs
without leaving the plugin to copy-paste from a different tool. The
plan calls this out explicitly: "from an empty database, a
department head can create School → Academic year → Department →
Process, then manage classrooms, subjects, teacher roster, process
participants, requirements, and assignments — all through clear,
translated, non-blocking UI" (plan §1).

The gate is the user journey that proves it. The runtime, the
registry skins, the default-UI islands, and the host wiring all have
to pass this gate before Phases 1 and 2 can close.

---

## 2. Scope of the gate

In scope (must pass):

1. The **setup checklist** appears on `/reparto` when no process
   exists.
2. The user can complete the checklist in order: School → Academic
   year → Department → Process.
3. Every prerequisite is created through a **cascading select** with
   **one-level inline create**; **no raw UUID input** is ever
   rendered for a record the user has to create themselves.
4. After the process is created, the user lands on the dashboard
   with charts and the process picker is replaced by a `Select`
   that lists the new process as the current selection.
5. Every step surfaces a **visible reason** for any disabled
   action (plan §4: "no silently-dead buttons").
6. The full journey works in **English, French, and Spanish** with
   no missing i18n keys.
7. The journey survives a page reload (the created process is
   persisted and re-selected).

Out of scope (deferred to later gates — Phase 3+):

- Subjects, classrooms, hour requirements, process participants,
  assignments, and the meeting flow.
- Audit visibility, charts beyond a happy-path smoke, the
  read-only dashboard mode, transition controls, archive, link-user.

These are exercised by other acceptance tests (Phase 3 gate and
Phase 4 gate). The empty-DB bootstrap gate stops at "I have a
process and the dashboard renders".

---

## 3. Pre-conditions

- Backend `reparto-docente-m8` is reachable at
  `PUBLIC_REPARTO_API_BASE`.
- Auth plugin `@mano8/astro-auth-m8` is wired; the test user holds
  the **writer** role for reparto (so `POST` is allowed).
- The database is empty for this user (or at least empty for the
  school the user is bootstrapping): no schools, no academic years,
  no departments, no processes.
- The locale is one of `en` / `fr` / `es`.

---

## 4. The user journey (step-by-step)

| # | User action | Visible UI | API call(s) issued | Success signal |
| --- | --- | --- | --- | --- |
| 1 | Open `/reparto`. | Setup checklist card. The four reference-data steps read "not started"; every process-scoped step reads *not checked here* with the reason (§8 of the freeze). Empty process picker: "No processes yet". | `GET /assignment-processes/` (returns `{ data: [], count: 0 }`) | Checklist card is visible; "No processes yet" empty state is shown. |
| 2 | Click **Open** next to **Create a school**. | School dialog opens, focused on the `name` field. | — | Dialog is open, `name` field is focused, the **Save changes** button is disabled. |
| 3 | Fill `name = "IES Almería Centro"`, optional fields, click **Save changes**. | Dialog closes, toast "School created". The school appears in the schools table; the checklist step 1 turns green. | `POST /schools/` | The school row is visible; checklist step 1 shows ✓. |
| 4 | Click **Open** next to **Create an academic year**. | Academic year dialog. `start_date` and `end_date` use date inputs (no timezone round-trip — see contract-inventory §1.2). | — | Dialog is open, `label` is focused. |
| 5 | Fill `label = "2025-2026"`, `start_date = "2025-09-01"`, `end_date = "2026-06-30"`, click **Save changes**. | Dialog closes, toast "Academic year created". Checklist step 2 turns green. | `POST /academic-years/` | Academic year is listed with `status = active`. |
| 6 | Click **Open** next to **Create a department**. | Department dialog. The **School** field is a `<Select>` populated from `GET /schools/`. The currently-empty list shows the school from step 3 because it was just created. | `GET /schools/` (background, may have been fetched earlier) | School appears in the `<Select>`; selecting it sets `school_id`. |
| 7 | Fill `name = "Matemáticas"`. The `slug` is auto-derived and shown read-only. Click **Save changes**. | Dialog closes, toast "Department created". Checklist step 3 turns green. | `POST /departments/` | Department row is visible; `slug` is `matematicas`. |
| 8 | Click **Open** next to **Create an assignment process**. | Process dialog. Three selects: **Academic year**, **School**, **Department**. Each is populated from its own list hook. | `GET /academic-years/`, `GET /schools/`, `GET /departments/` | The three selects show the records created in steps 3, 5, 7. |
| 9 | Select the academic year, the school, the department, click **Create process**. | Dialog closes, toast "Process created". The process picker is replaced by a `<Select>` showing the new process. The dashboard island loads. | `POST /assignment-processes/` | The dashboard renders. The process picker is no longer visible. |
| 10 | Reload the page. | The last-selected process is rehydrated from `localStorage` and the dashboard renders without the setup checklist. | `GET /assignment-processes/{id}/summary`, `GET /assignment-processes/{id}/dashboard` | Dashboard renders for the same process; no setup checklist. |

### 4.1 The "one-level inline create" shortcut

To avoid modal-in-modal chains, each select exposes a single
**"+ Create new …"** entry at the bottom. Picking it opens the
target entity's own dialog inline (not nested). When the user
saves, the new id is auto-selected in the parent select and the
parent dialog re-validates. This is the only nesting permitted
(D-7 from plan §13).

Example: in step 8, if there were no academic years, the user
could click **"+ Create new academic year"** in the **Academic
year** select. The academic-year dialog opens, the user fills it
in, saves, and the select now has the new year auto-selected.
The process dialog stays open. **No modal-in-modal of a second
dialog in the same flow.** When a deeper prerequisite is missing
(e.g. the user tries to create a requirement before the process
exists), the system shows a clear **"Create missing prerequisite"**
link to that entity's page rather than opening a dialog inside a
dialog.

### 4.2 What the user must NEVER see

- A `<input type="text">` for any of: school id, academic year id,
  department id, process id, teacher profile id, classroom id,
  subject id, requirement id, process-teacher id, assignment id.
- A placeholder or default value that is a UUID string.
- A `data-reparto-field` whose value renders a UUID in static
  markup (visible or via DOM inspection).
- A button that does nothing when clicked (silent dead button).
- A disabled button without a tooltip / inline reason.
- An error message that is just `Error` or `undefined`.
- A required i18n key that renders the raw key (e.g. `error.required`).
- A flash of un-hydrated React island showing "undefined".

These are forbidden by the `tests/empty-db-bootstrap.test.ts`
document test in this phase and the runtime UI tests in Phase 1+.

---

## 5. The expected API call sequence (network contract)

The journey issues exactly the following calls, in this order, with
these properties. Anything else (extra calls, missing calls, wrong
method, wrong path) fails the gate.

```text
GET    /schools/                            → 200 { data: [], count: 0 }
GET    /academic-years/                     → 200 { data: [], count: 0 }
GET    /departments/                        → 200 { data: [], count: 0 }
GET    /assignment-processes/               → 200 { data: [], count: 0 }

POST   /schools/                            → 201 SchoolPublic { id: S1, name: "IES Almería Centro", ... }
POST   /academic-years/                     → 201 AcademicYearPublic { id: Y1, label: "2025-2026", ... }
POST   /departments/                        → 201 DepartmentPublic { id: D1, school_id: S1, name: "Matemáticas", slug: "matematicas", ... }
POST   /assignment-processes/               → 201 AssignmentProcessPublic { id: P1, academic_year_id: Y1, school_id: S1, department_id: D1, status: "draft", ... }

# page reload — the localStorage rehydrate re-fetches the dashboard
GET    /assignment-processes/P1/summary     → 200 ProcessSummary
GET    /assignment-processes/P1/dashboard   → 200 ProcessDashboard
```

Two important rules:

1. **`/schools`, `/academic-years`, `/departments`, `/teacher-profiles`
   are NEVER reached as FK inputs.** They are reached only as list
   endpoints to populate selects. The cascade is "user picks a row
   from a list", not "user types a UUID".
2. **No `PATCH` or `DELETE` is issued during the bootstrap.** The
   journey is create-only; the only allowed exception is
   `POST /academic-years/{id}/archive` (manual test) and is **not**
   part of the bootstrap gate.

### 5.1 Concurrent-call policy

The runtime is free to issue the four `GET` list calls in parallel
(TanStack Query default). The four `POST` calls **must** be
sequential: each subsequent create depends on the previous id
(`department.school_id = S1` requires `S1` to exist; the same for
the process). The runtime's hooks must therefore issue the
dependency chain serially. This is a behavioural property the
runtime test (Phase 1) will assert.

---

## 6. Acceptance criteria (the gate, in checklist form)

Phases 1 and 2 are not "done" until every one of the following is
green:

- [ ] **AC-1** Setup checklist card is visible on `/reparto` when
      `GET /assignment-processes/` returns an empty list.
- [ ] **AC-2** The checklist lists the §8.2 setup workflow grouped by
      the three stages, in the order frozen in `ui-naming-freeze.md`
      §8, and it is the **same derivation** the dashboard renders
      (`buildSetupChecklist`). *Amended 2026-08-11 by audit finding
      `S2-07`:* this criterion used to name nine steps ending
      "Teacher roster → Requirements → Process participants", which
      was the pre-three-stage workflow — no allocation, no matrix,
      no plan, no lock, requirement generation misfiled as setup,
      and two labels over one condition. Only the four steps this
      gate exercises (School → Academic year → Department →
      Process) are exercised here; the rest are reachable.
- [ ] **AC-3** Each step this screen can open links to its create
      flow, and the link is enabled even if the previous steps are
      incomplete (the user can start in any order; the cascade only
      kicks in at the Process dialog). A step whose condition this
      screen cannot test — every process-scoped step, before a
      process is selected — states that reason instead of offering
      a dead control.
- [ ] **AC-4** The Process dialog shows three cascading selects
      (academic year, school, department) populated from
      `useRepartoSchools`, `useRepartoAcademicYears`,
      `useRepartoDepartments`. None of the three is a raw `<input>`.
- [ ] **AC-5** Each select exposes a single-level **"+ Create new …"**
      entry. Picking it opens the target entity's dialog inline
      (single modal at a time, no nested modals). On success, the
      new id is selected in the parent select.
- [ ] **AC-6** The Create-process button is disabled until all three
      selects carry a value. The disabled state ships a tooltip
      `disabled.noProcess` from the dictionary.
- [ ] **AC-7** Submitting the Process dialog issues
      `POST /assignment-processes/` with the three ids. On success,
      the process picker is replaced by a `<Select>` of processes
      (the new one is the current selection).
- [ ] **AC-8** A page reload rehydrates the last-selected process
      from `localStorage`. If the stored process no longer exists,
      the runtime falls back to the most-recent process from
      `GET /assignment-processes/`. If the list is empty, the
      setup checklist returns.
- [ ] **AC-9** Every disabled button anywhere on the journey has a
      visible reason (tooltip on hover, inline text below the
      button for touch / keyboard focus). No silently-dead buttons.
- [ ] **AC-10** The journey works in `en`, `fr`, and `es`. No
      missing i18n key. The dictionary completeness test
      (`tests/i18n-completeness.test.ts`, Phase 1) is green.
- [ ] **AC-11** No raw UUID string appears in any user-facing
      default, placeholder, or rendered text on the journey. A
      render assertion scans the produced HTML for
      `\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b`
      and fails on hit.
- [ ] **AC-12** Error responses from the backend are mapped to the
      `error.*` dictionary keys (see
      `docs/ui-naming-freeze.md` §9.2). The user never sees a raw
      `Error: ...` stack.
- [ ] **AC-13** A 4xx duplicate-name response on School create
      surfaces `error.duplicate` in the dialog form. The same
      response on Department shows
      `error.duplicateScoped` with `{scope}` = school name.
- [ ] **AC-14** A 401 response during the journey surfaces
      `error.unauthorized` and the dialog stays open.
- [ ] **AC-15** The journey completes in under 6 wall-clock seconds
      on the local dev backend (cold cache, single user, no
      throttling) — this is a soft budget enforced in CI to catch
      accidental waterfalls.

---

## 7. Test plan (how we run the gate)

The gate is exercised at three levels. All three are required.

### 7.1 Unit — `tests/empty-db-bootstrap.test.ts` (this phase, Phase 0.5)

A document test that:

- Asserts this spec exists and contains the AC list above.
- Asserts the API sequence is present and in the expected order.
- Asserts the "no raw UUID input" rule is encoded in the AC list.
- Asserts the spec references
  `docs/ui-naming-freeze.md` for i18n keys.
- Asserts the spec references the contract-inventory for the
  required-body shape of each entity.

This test runs in `npm test` from day one. It is the contract
test for the gate definition itself.

### 7.2 Component — Phase 1 (runtime, registry, default-ui)

`tests/default-ui-bootstrap.test.tsx` (added in Phase 1) renders
the create-process dialog with mocked list hooks and asserts the
form structure:

- Three selects, three inputs (none of them a UUID field).
- Each select exposes the **"+ Create new"** entry.
- Submitting with all three selects populated calls
  `useCreateRepartoProcess` with the right body.
- The submit button is disabled until all three are populated.
- The disabled button has a `data-disabled-reason` attribute.

### 7.3 End-to-end — Phase 2 (host wiring + integration tests)

`tests/e2e/empty-db-bootstrap.spec.ts` (Playwright, in the host
`fa-ui-m8` repo, not in this plugin) drives the journey against a
real backend in CI:

- Spin up `reparto-docente-m8` with an empty DB.
- Sign in as a writer.
- Walk the journey.
- Assert each AC visually + via DOM.
- Tear down.

This e2e is owned by `fa-ui-m8` (host) and runs in the host's CI;
the plugin only owns §7.1 and §7.2.

### 7.4 Manual — pre-release

The manual checklist lives in plan §12 ("Manual QA checklist").
The empty-DB bootstrap is the first item on it.

---

## 8. Fixture plan

Two fixtures are added in Phase 1+:

- `tests/fixtures/empty-db.json` — the empty-DB fixture: every
  global list is `[]`, no process exists. Used by §7.1 and §7.2.
- `tests/fixtures/realistic-department.json` — one school, one
  academic year, one department, ~5 teachers, several classrooms
  and subjects, requirements, partial assignments. Used by the
  Phase 3+ tests, not by this gate.

This spec owns `empty-db.json`; the realistic-department fixture
is a Phase 3 deliverable (plan §9).

---

## 9. Reference

- Plan §1 ("Context — why this change") — the user outcome this
  gate proves.
- Plan §4 ("UX, meeting-readiness & i18n requirements") — the
  visible-reason and i18n rules.
- Plan §4b ("Architecture invariants") — `"current"` semantics
  and process-picker persistence.
- Plan §5 ("Runtime") — the hook + query-key contract the runtime
  tests assert.
- Plan §6 ("Registry skins") — the `reparto-fk-select` block.
- Plan §11 (Phase 1 and Phase 2 acceptance criteria) — phases
  that close on this gate.
- `docs/contract-inventory.md` — the exact path/verb/body for
  every call in §5.
- `docs/ui-naming-freeze.md` — the dictionary keys for every
  string in the journey.

---

## 10. Phase 0.5 exit condition

Phase 0.5 step 3 is **done** when:

- This spec is committed.
- `tests/empty-db-bootstrap.test.ts` is committed and green in
  `npm test`.
- The spec is referenced from the plan and from `CLAUDE.md` (Phase
  1 will add the reference in `CLAUDE.md`; for now, the plan
  carries the link).
