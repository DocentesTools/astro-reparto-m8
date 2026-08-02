import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const processId = "11111111-1111-4111-8111-111111111111";
const profileId = "22222222-2222-4222-8222-222222222222";
const teachingGroupId = "33333333-3333-4333-8333-333333333333";
const subjectId = "44444444-4444-4444-8444-444444444444";
const requirementId = "55555555-5555-4555-8555-555555555555";
const teachingActivityId = "56565656-5656-4656-8656-565656565656";
const teachingPlanId = "57575757-5757-4757-8757-575757575757";
const participantId = "66666666-6666-4666-8666-666666666666";
const assignmentId = "77777777-7777-4777-8777-777777777777";
const auditId = "88888888-8888-4888-8888-888888888888";
const classroomStageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const classroomStage = { id: classroomStageId, stage: "Secundaria", min_grade: 1, max_grade: 4, label: "ESO", created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" };

const queryState = vi.hoisted(() => ({
  processes: [] as { id: string; status: string }[],
  subjects: [] as unknown[],
  groups: [] as unknown[],
  requirements: [] as unknown[],
  participants: [] as unknown[],
  assignments: [] as unknown[],
  audit: [] as unknown[],
  teachers: [] as unknown[],
  schools: [] as unknown[],
  years: [] as unknown[],
  departments: [] as unknown[],
  stages: [] as unknown[],
  planBalance: null as unknown,
  teachingPlan: null as unknown,
  planValidations: null as unknown,
  groupSubjects: [] as unknown[],
  teachingActivities: [] as unknown[]
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const scope = queryKey[1];
    if (scope === "processes") {
      const subkey = queryKey[2];
      if (subkey === "list") {
        return {
          data: { data: queryState.processes, count: queryState.processes.length },
          error: null,
          isError: false,
          isLoading: false
        };
      }
      if (subkey === "detail") {
        const entityScope = queryKey[4];
        if (entityScope === "teaching-plan" && queryKey[5] === "summary") {
          return {
            data: queryState.planBalance,
            error: null,
            isError: false,
            isLoading: false
          };
        }
        if (entityScope === "teaching-plan" && queryKey[5] === "validations") {
          return {
            data: queryState.planValidations,
            error: null,
            isError: false,
            isLoading: false
          };
        }
        if (entityScope === "teaching-plan") {
          return {
            data: queryState.teachingPlan,
            error: null,
            isError: false,
            isLoading: false
          };
        }
        const rows =
          entityScope === "subjects"
            ? queryState.subjects
            : entityScope === "group-subjects"
              ? queryState.groupSubjects
              : entityScope === "teaching-activities"
                ? queryState.teachingActivities
            : entityScope === "groups"
              ? queryState.groups
              : entityScope === "requirements"
                ? queryState.requirements
                : entityScope === "teachers"
                  ? queryState.participants
                  : entityScope === "assignments"
                    ? queryState.assignments
                    : entityScope === "audit-events"
                      ? queryState.audit
                      : [];
        return {
          data: { data: rows, count: rows.length },
          error: null,
          isError: false,
          isLoading: false
        };
      }
    }
    if (scope === "teacher-profiles") {
      return {
        data: { data: queryState.teachers, count: queryState.teachers.length },
        error: null,
        isError: false,
        isLoading: false
      };
    }
    if (scope === "schools" || scope === "academic-years" || scope === "departments") {
      return { data: { data: [], count: 0 }, error: null, isError: false, isLoading: false };
    }
    if (scope === "classroom-stages") return { data: { data: queryState.stages, count: queryState.stages.length }, error: null, isError: false, isLoading: false };
    return { data: undefined, error: null, isError: false, isLoading: false };
  },
  useMutation: () => ({ isPending: false, isError: false, mutate: () => undefined }),
  useQueryClient: () => ({ invalidateQueries: () => undefined })
}));

vi.mock("sonner", () => ({ Toaster: () => null, toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("radix-ui", () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const Title = ({ children, className }: { children?: ReactNode; className?: string }) => <h2 className={className}>{children}</h2>;
  const Description = ({ children, className }: { children?: ReactNode; className?: string }) => <p className={className}>{children}</p>;
  const DialogOverlay = ({ className }: { className?: string }) => <div className={className} data-slot="dialog-overlay" />;
  const DialogContent = ({ children, className }: { children?: ReactNode; className?: string }) => <section className={className} role="dialog">{children}</section>;
  const AlertOverlay = ({ className }: { className?: string }) => <div className={className} data-slot="alert-dialog-overlay" />;
  const AlertContent = ({ children, className }: { children?: ReactNode; className?: string }) => <section className={className} role="alertdialog">{children}</section>;
  return {
    Dialog: { Root: Passthrough, Portal: Passthrough, Close: Passthrough, Title, Description, Overlay: DialogOverlay, Content: DialogContent },
    AlertDialog: { Root: Passthrough, Portal: Passthrough, Cancel: Passthrough, Action: Passthrough, Title, Description, Overlay: AlertOverlay, Content: AlertContent }
  };
});

function reset() {
  queryState.processes = [{ id: processId, status: "draft" }];
  queryState.subjects = [];
  queryState.groups = [];
  queryState.requirements = [];
  queryState.participants = [];
  queryState.assignments = [];
  queryState.audit = [];
  queryState.teachers = [];
  queryState.stages = [classroomStage];
  queryState.planBalance = null;
  queryState.teachingPlan = null;
  queryState.planValidations = null;
  queryState.groupSubjects = [];
  queryState.teachingActivities = [];
}

describe("Phase 3 step 2 — process-scoped CRUD islands", () => {
  it("renders the package-owned planning starter view", async () => {
    reset();
    queryState.planBalance = {
      teaching_plan_id: "99999999-9999-4999-8999-999999999999",
      assignment_process_id: processId,
      group: {
        total_group_load: "120.00",
        allocated_group_weekly_hours: "116.00",
        allocation_difference: "4.00",
        is_balanced: false
      },
      teacher: {
        total_teacher_load: "124.00",
        participant_target_total: "124.00",
        teacher_load_difference: "0.00",
        is_balanced: true
      },
      is_exact: false
    };
    queryState.teachingPlan = {
      id: "99999999-9999-4999-8999-999999999999",
      assignment_process_id: processId,
      allocation_revision_id: null,
      status: "locked",
      current_generation_number: 0,
      locked_at: "2026-07-30T10:00:00Z",
      locked_by_user_id: "12121212-1212-4121-8121-121212121212",
      requirements_generated_at: null,
      stale_reason: null,
      feasibility_status: "feasible",
      feasibility_generation: 0,
      feasibility_checked_at: "2026-07-30T10:00:00Z",
      feasibility_input_fingerprint: "fingerprint",
      feasibility_solver_version: "solver-v1",
      feasibility_diagnostics_ref: null,
      created_at: "2026-07-30T09:00:00Z",
      updated_at: "2026-07-30T10:00:00Z"
    };
    queryState.planValidations = {
      teaching_plan_id: "99999999-9999-4999-8999-999999999999",
      assignment_process_id: processId,
      is_assignment_ready: true,
      blocking_count: 0,
      warning_count: 0,
      messages: []
    };
    const { RepartoPlanningView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    const html = renderToStaticMarkup(
      <RepartoPlanningView locale="en" processId={processId} />
    );

    expect(html).toContain('data-reparto-route="planning"');
    expect(html).toContain('data-reparto-group="process"');
    expect(html).toContain('data-reparto-panel="planning"');
    expect(html).toContain(`data-process-id="${processId}"`);
    expect(html).toContain("Reparto planning");
    expect(html).toContain('data-reparto-slot="planning-balance-header"');
    expect(html).toContain('data-reparto-balance-axis="group"');
    expect(html).toContain('data-reparto-balance-axis="teacher"');
    expect(html).toContain(
      'data-reparto-component="main-subject-materialization"'
    );
    expect(html).toContain(
      'data-reparto-component="secondary-activity-editor"'
    );
    expect(html).toContain(
      'data-reparto-component="plan-lock-requirement-generation"'
    );
    expect(html).toContain('data-plan-lock-confirmed="true"');
    expect(html).toContain('data-reparto-slot="plan-lock-validations"');
    expect(html).toContain("No live secondary activities have been added.");
    for (const value of ["116.00 h", "120.00 h", "4.00 h", "124.00 h", "0.00 h"]) {
      expect(html).toContain(value);
    }
  });

  it("keeps all planning balance metrics visible while data is unavailable", async () => {
    reset();
    const { PlanningBalanceHeader } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    const { getRepartoDictionary } = await import(
      "../src/runtime/i18n/index.js"
    );
    const html = renderToStaticMarkup(
      <PlanningBalanceHeader
        balance={null}
        dict={getRepartoDictionary("en")}
        error={{ status: 404 }}
        isLoading
      />
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading planning balance.");
    expect(html).toContain("Planning balance is unavailable.");
    expect(html.match(/<dt[^>]*>Target<\/dt>/g)).toHaveLength(2);
    expect(html.match(/<dt[^>]*>Planned<\/dt>/g)).toHaveLength(2);
    expect(html.match(/<dt[^>]*>Difference<\/dt>/g)).toHaveLength(2);
    expect(html.match(/<dd[^>]*>—<\/dd>/g)).toHaveLength(6);
  });

  it("surfaces a planning balance query error without hiding the metrics", async () => {
    reset();
    const { PlanningBalanceHeader } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    const { getRepartoDictionary } = await import(
      "../src/runtime/i18n/index.js"
    );
    const html = renderToStaticMarkup(
      <PlanningBalanceHeader
        balance={null}
        dict={getRepartoDictionary("en")}
        error={new Error("Balance request failed")}
        isLoading={false}
      />
    );

    expect(html).toContain("Balance request failed");
    expect(html).toContain('data-reparto-balance-axis="group"');
    expect(html).toContain('data-reparto-balance-axis="teacher"');
  });

  it("subjects view renders the list with Create + Edit + Delete row actions", async () => {
    reset();
    queryState.subjects = [
      { id: subjectId, assignment_process_id: processId, name: "Matemáticas", allocation_category: "main", activity_type: "ordinary", default_group_weekly_hours: 4, default_teacher_weekly_hours_per_position: 4, default_required_teacher_count: 1, allows_multiple_groups: false, allows_zero_groups: false, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoSubjectsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoSubjectsView processId={processId} />);
    expect(html).toContain('data-reparto-route="subjects"');
    expect(html).toContain('data-reparto-group="process"');
    expect(html).toContain('data-reparto-table="subjects"');
    expect(html).toContain('data-reparto-data-table="shared-registry"');
    expect(html).toContain('data-reparto-action="create"');
    expect(html).toContain('data-reparto-row-action="edit"');
    expect(html).toContain('data-reparto-row-action="delete"');
    expect(html).toContain("Matemáticas");
    // full data table: every data column is orderable, the 2nd (Actions) column is not
    expect(html).toContain('data-reparto-sort-column="name"');
    expect(html).toContain('data-reparto-sort-column="allocation-category"');
    expect(html).toContain('data-reparto-sort-column="activity-type"');
    expect(html).not.toContain('data-reparto-sort-column="actions"');
    expect(html).toMatch(/Actions<\/th><th[^>]*><button[^>]*data-reparto-sort-column="allocation-category"/);
    expect(html).toContain('data-reparto-pagination="top"');
    expect(html).toContain('data-reparto-pagination="bottom"');
    expect(html).toContain("Search name...");
    // The two-stage `stage` slot is retired, not reused (ui-naming-freeze §12).
    expect(html).not.toContain("data-subject-stage");
    expect(html).toContain('data-subject-allocation-category="main"');
    expect(html).toContain('data-subject-activity-type="ordinary"');
  });

  it("subject create + edit forms render inside a shadcn Dialog modal", async () => {
    reset();
    const { useDict } = await import("../src/runtime/react/default-ui/process-crud/shared.js");
    const dict = useDict("en");
    const { SubjectAdd } = await import("../src/runtime/react/default-ui/process-crud/subjects/add.js");
    const html = renderToStaticMarkup(
      <SubjectAdd dict={dict} processId={processId} onDone={() => undefined} />
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('data-reparto-dialog="subject-create"');
    expect(html).toContain('data-reparto-form="subject"');
    // §3.5 classification replaces the deleted two-stage text field.
    expect(html).toContain('data-reparto-field="allocation-category"');
    expect(html).toContain('data-reparto-field="activity-type"');
    expect(html).not.toContain('data-reparto-field="stage"');
    expect(html).toContain("Secondary");
    expect(html).toContain("Co-teaching");

    const { SubjectEdit } = await import("../src/runtime/react/default-ui/process-crud/subjects/edit.js");
    const editHtml = renderToStaticMarkup(
      <SubjectEdit
        dict={dict}
        processId={processId}
        subject={{ id: subjectId, assignment_process_id: processId, name: "Tutoría", allocation_category: "secondary", activity_type: "tutoring", default_group_weekly_hours: null, default_teacher_weekly_hours_per_position: null, default_required_teacher_count: 1, allows_multiple_groups: false, allows_zero_groups: false, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }}
        onDone={() => undefined}
      />
    );
    expect(editHtml).toContain('data-reparto-dialog="subject-edit"');
    expect(editHtml).toContain('data-reparto-field="allocation-category"');
    expect(editHtml).not.toContain('data-reparto-field="stage"');
  });

  it("subject delete confirmation renders inside a shadcn AlertDialog", async () => {
    reset();
    const { useDict } = await import("../src/runtime/react/default-ui/process-crud/shared.js");
    const dict = useDict("en");
    const { SubjectDelete } = await import("../src/runtime/react/default-ui/process-crud/subjects/delete.js");
    const html = renderToStaticMarkup(
      <SubjectDelete
        dict={dict}
        processId={processId}
        subject={{ id: subjectId, assignment_process_id: processId, name: "Matemáticas", allocation_category: "secondary", activity_type: "tutoring", default_group_weekly_hours: null, default_teacher_weekly_hours_per_position: null, default_required_teacher_count: 1, allows_multiple_groups: false, allows_zero_groups: false, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }}
        onDone={() => undefined}
      />
    );
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain("Matemáticas");
  });

  it("classrooms view renders classroom rows with stage/grade attributes", async () => {
    reset();
    queryState.groups = [
      { id: teachingGroupId, assignment_process_id: processId, classroom_stage_id: classroomStageId, classroom_stage: classroomStage, grade: 1, group_code: "A", label: "1° ESO A", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoClassroomsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoClassroomsView processId={processId} />);
    expect(html).toContain('data-reparto-route="classrooms"');
    expect(html).toContain('data-reparto-actions="classrooms"');
    expect(html).toContain('class="flex justify-end gap-2 pb-4"');
    expect(html).toContain("Create groups");
    expect(html).toMatch(/data-reparto-actions="classrooms"[\s\S]*data-reparto-panel="classrooms"/);
    expect(html).toContain('data-reparto-table="classrooms"');
    expect(html).toContain('data-reparto-data-table="shared-registry"');
    expect(html).toContain('data-data-table-select-all="visible"');
    expect(html).toContain(`data-data-table-row-selection="${teachingGroupId}"`);
    expect(html).toContain("Select all visible classrooms");
    expect(html).toContain("Select 1° ESO A");
    expect(html).toContain('data-reparto-sort-column="stage"');
    expect(html).toContain('data-reparto-sort-column="grade"');
    expect(html).toContain('data-reparto-sort-column="group_code"');
    expect(html).toContain('data-reparto-sort-column="label"');
    expect(html).not.toContain('data-reparto-sort-column="actions"');
    expect(html).toMatch(/Actions<\/th><th[^>]*><button[^>]*data-reparto-sort-column="grade"/);
    expect(html).toContain('data-reparto-pagination="top"');
    expect(html).toContain('data-reparto-pagination="bottom"');
    expect(html).toContain("Search stage, group code, or label...");
    expect(html).toContain("1° ESO A");
    expect(html).toContain('data-classroom-stage="Secundaria"');
    expect(html).toContain('data-classroom-grade="1"');
  });

  it("renders the selected-classroom destructive confirmation with the selected count", async () => {
    reset();
    const { ClassroomBulkDelete } = await import(
      "../src/runtime/react/default-ui/process-crud/classrooms/bulk-delete.js"
    );
    const { en } = await import("../src/runtime/i18n/en.js");
    const html = renderToStaticMarkup(
      <ClassroomBulkDelete
        dict={en}
        groups={[
          { id: teachingGroupId, assignment_process_id: processId, classroom_stage_id: classroomStageId, classroom_stage: classroomStage, grade: 1, group_code: "A", label: "1° ESO A", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
        ]}
        processId={processId}
        onDone={() => undefined}
      />
    );
    expect(html).toContain("Delete selected classrooms");
    expect(html).toContain("Selected classrooms to delete: 1.");
  });

  it("requirements view groups generated slots by activity and position with authoritative status", async () => {
    reset();
    queryState.subjects = [
      { id: subjectId, assignment_process_id: processId, name: "Matemáticas", allocation_category: "main", activity_type: "ordinary", default_group_weekly_hours: 4, default_teacher_weekly_hours_per_position: 4, default_required_teacher_count: 1, allows_multiple_groups: false, allows_zero_groups: false, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.teachingActivities = [
      { id: teachingActivityId, teaching_plan_id: teachingPlanId, subject_id: subjectId, allocation_category: "main", activity_type: "ordinary", group_weekly_hours_per_group: "4.00", teacher_weekly_hours_per_position: "4.00", required_teacher_count: 1, notes: "Main teaching", source: "main_generated", source_group_subject_id: null, sync_state: "current", retired_at: null, group_subject_ids: [], linked_group_count: 0, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.teachingPlan = {
      id: teachingPlanId,
      assignment_process_id: processId,
      allocation_revision_id: null,
      status: "reconciliation_required",
      current_generation_number: 3,
      locked_at: "2026-07-04T10:00:00Z",
      locked_by_user_id: null,
      requirements_generated_at: "2026-07-04T10:00:00Z",
      stale_reason: "allocation_changed",
      feasibility_status: "feasible",
      feasibility_generation: 3,
      feasibility_checked_at: "2026-07-04T10:00:00Z",
      feasibility_input_fingerprint: "fingerprint",
      feasibility_solver_version: "solver-v1",
      feasibility_diagnostics_ref: null,
      created_at: "2026-07-04T10:00:00Z",
      updated_at: "2026-07-04T10:00:00Z"
    };
    queryState.requirements = [
      { id: requirementId, assignment_process_id: processId, teaching_activity_id: teachingActivityId, position_index: 0, required_teacher_hours: "4.00", status: "assigned", created_generation: 2, last_validated_generation: 3, retired_generation: null, superseded_by_requirement_id: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" },
      { id: "58585858-5858-4858-8858-585858585858", assignment_process_id: processId, teaching_activity_id: teachingActivityId, position_index: 1, required_teacher_hours: "4.00", status: "stale", created_generation: 1, last_validated_generation: 2, retired_generation: 3, superseded_by_requirement_id: requirementId, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoHourRequirementsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoHourRequirementsView processId={processId} />);
    expect(html).toContain('data-reparto-route="requirements"');
    expect(html).toContain('data-reparto-list="requirements-by-activity"');
    expect(html).toContain('data-teaching-plan-status="reconciliation_required"');
    expect(html).toContain('data-requirement-status="assigned"');
    expect(html).toContain("Matemáticas · Ordinary");
    expect(html).toContain("Position 1");
    expect(html).toContain("4.00 teacher hours");
    expect(html).toContain("Created in generation 2; validated in generation 3.");
    expect(html).toContain("Retired in generation 3.");
    expect(html).toContain("A replacement slot was recorded.");
    expect(html).toContain('data-retired-generation="3"');
    expect(html).not.toContain('data-reparto-action="create"');
    expect(html).not.toContain('data-reparto-row-action="edit"');
    expect(html).not.toContain('data-reparto-row-action="delete"');
  });

  it("requirements view renders a localized read-only empty state", async () => {
    reset();
    const { RepartoHourRequirementsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoHourRequirementsView locale="es" processId={processId} />);
    expect(html).toContain('data-reparto-state="no-generated-requirements"');
    expect(html).toContain("Todavía no se han generado puestos horarios");
    expect(html).not.toContain('data-reparto-action="create"');
  });

  it("participants view renders teacher display_name + edit/delete row actions", async () => {
    reset();
    queryState.teachers = [
      { id: profileId, display_name: "Profesora Ana", user_id: null, active: true, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.participants = [
      { id: participantId, assignment_process_id: processId, teacher_profile_id: profileId, available_hours: 18, participates_in_selection: true, selection_position: null, selection_points: null, selection_criteria_label: null, selection_notes: null, order_locked: false, status: "active", created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoProcessParticipantsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoProcessParticipantsView processId={processId} />);
    expect(html).toContain('data-reparto-route="participants"');
    expect(html).toContain('data-reparto-table="participants"');
    expect(html).toContain("Profesora Ana");
    expect(html).toContain('data-reparto-row-action="edit"');
    expect(html).toContain('data-reparto-row-action="delete"');
  });

  it("participants view disables Create with a missing prereq reason when the teacher roster is empty", async () => {
    reset();
    const { RepartoProcessParticipantsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoProcessParticipantsView processId={processId} />);
    expect(html).toContain('data-disabled-reason=');
    const createMatch = html.match(/<button[^>]*data-reparto-action="create"[^>]*>/);
    expect(createMatch?.[0]).toContain("disabled");
  });

  it("assignments view renders assignment rows with edit/delete actions and names joined from FK lookups", async () => {
    reset();
    queryState.groups = [
      { id: teachingGroupId, assignment_process_id: processId, classroom_stage_id: classroomStageId, classroom_stage: classroomStage, grade: 1, group_code: "A", label: "1° ESO A", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.subjects = [
      { id: subjectId, assignment_process_id: processId, name: "Matemáticas", allocation_category: "main", activity_type: "ordinary", default_group_weekly_hours: 4, default_teacher_weekly_hours_per_position: 4, default_required_teacher_count: 1, allows_multiple_groups: false, allows_zero_groups: false, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.teachers = [
      { id: profileId, display_name: "Profesora Ana", user_id: null, active: true, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.requirements = [
      { id: requirementId, assignment_process_id: processId, teaching_activity_id: teachingActivityId, position_index: 0, required_teacher_hours: "4.00", status: "available", created_generation: 1, last_validated_generation: 1, retired_generation: null, superseded_by_requirement_id: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.teachingActivities = [
      { id: teachingActivityId, teaching_plan_id: teachingPlanId, subject_id: subjectId, allocation_category: "main", activity_type: "ordinary", group_weekly_hours_per_group: "4.00", teacher_weekly_hours_per_position: "4.00", required_teacher_count: 1, notes: null, source: "main_generated", source_group_subject_id: null, sync_state: "current", retired_at: null, group_subject_ids: [], linked_group_count: 0, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.participants = [
      { id: participantId, assignment_process_id: processId, teacher_profile_id: profileId, available_hours: 18, participates_in_selection: true, selection_position: null, selection_points: null, selection_criteria_label: null, selection_notes: null, order_locked: false, status: "active", created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.assignments = [
      { id: assignmentId, assignment_process_id: processId, hour_requirement_id: requirementId, process_teacher_id: participantId, assigned_hours: 4, assignment_type: "main", source: "department_head", status: "draft", chosen_by_user_id: null, confirmed_by_user_id: null, override_reason: null, overridden_by_user_id: null, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoAssignmentsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoAssignmentsView processId={processId} />);
    expect(html).toContain('data-reparto-route="assignments"');
    expect(html).toContain('data-reparto-table="assignments"');
    expect(html).toContain("Matemáticas · Ordinary · Position 1");
    expect(html).toContain("Profesora Ana");
    expect(html).toContain('data-reparto-row-action="delete"');
  });

  it("assignment add form shows create-missing-prerequisite links when requirements+participants are empty (D-7)", async () => {
    reset();
    queryState.requirements = [];
    queryState.participants = [];
    const { useDict } = await import("../src/runtime/react/default-ui/process-crud/shared.js");
    const dict = useDict("en");
    const { AssignmentAdd } = await import("../src/runtime/react/default-ui/process-crud/assignments/add.js");
    const html = renderToStaticMarkup(
      <AssignmentAdd
        dict={dict}
        processId={processId}
        requirementsHref={`/reparto/processes/${processId}/requirements`}
        participantsHref={`/reparto/processes/${processId}/participants`}
        requirementLabel={() => "—"}
        participantName={() => "—"}
        onDone={() => undefined}
      />
    );
    expect(html).toContain('data-reparto-form="assignment"');
    expect(html).toContain('data-reparto-action="create-missing-prerequisite"');
    expect(html).toContain(`/reparto/processes/${processId}/requirements`);
    expect(html).toContain(`/reparto/processes/${processId}/participants`);
  });

  it("audit view is read-only: no Create, Edit, or Delete actions; rows list the event type", async () => {
    reset();
    queryState.audit = [
      { id: auditId, assignment_process_id: processId, actor_user_id: null, actor_role: "department_head", event_type: "assignment.created", entity_type: "assignment", entity_id: assignmentId, before_json: null, after_json: null, reason: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoAuditView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoAuditView processId={processId} />);
    expect(html).toContain('data-reparto-route="audit"');
    expect(html).toContain('data-reparto-table="audit-events"');
    expect(html).toContain("assignment.created");
    expect(html).not.toContain('data-reparto-action="create"');
    expect(html).not.toContain('data-reparto-row-action="edit"');
    expect(html).not.toContain('data-reparto-row-action="delete"');

    const spanishHtml = renderToStaticMarkup(
      <RepartoAuditView locale="es" processId={processId} />
    );
    expect(spanishHtml).toContain("Reparto: Creado");
    expect(spanishHtml).toContain("Jefatura de departamento · Reparto");
  });
});
