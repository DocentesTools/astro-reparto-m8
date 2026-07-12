import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const processId = "11111111-1111-4111-8111-111111111111";
const profileId = "22222222-2222-4222-8222-222222222222";
const teachingGroupId = "33333333-3333-4333-8333-333333333333";
const subjectId = "44444444-4444-4444-8444-444444444444";
const requirementId = "55555555-5555-4555-8555-555555555555";
const participantId = "66666666-6666-4666-8666-666666666666";
const assignmentId = "77777777-7777-4777-8777-777777777777";
const auditId = "88888888-8888-4888-8888-888888888888";

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
  departments: [] as unknown[]
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
        const rows =
          entityScope === "subjects"
            ? queryState.subjects
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
    return { data: undefined, error: null, isError: false, isLoading: false };
  },
  useMutation: () => ({ isPending: false, isError: false, mutate: () => undefined }),
  useQueryClient: () => ({ invalidateQueries: () => undefined })
}));

function reset() {
  queryState.processes = [{ id: processId, status: "draft" }];
  queryState.subjects = [];
  queryState.groups = [];
  queryState.requirements = [];
  queryState.participants = [];
  queryState.assignments = [];
  queryState.audit = [];
  queryState.teachers = [];
}

describe("Phase 3 step 2 — process-scoped CRUD islands", () => {
  it("subjects view renders the list with Create + Edit + Delete row actions", async () => {
    reset();
    queryState.subjects = [
      { id: subjectId, assignment_process_id: processId, name: "Matemáticas", stage: "ESO", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoSubjectsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoSubjectsView processId={processId} />);
    expect(html).toContain('data-reparto-route="subjects"');
    expect(html).toContain('data-reparto-group="process"');
    expect(html).toContain('data-reparto-table="subjects"');
    expect(html).toContain('data-reparto-action="create"');
    expect(html).toContain('data-reparto-row-action="edit"');
    expect(html).toContain('data-reparto-row-action="delete"');
    expect(html).toContain("Matemáticas");
  });

  it("classrooms view renders classroom rows with stage/grade attributes", async () => {
    reset();
    queryState.groups = [
      { id: teachingGroupId, assignment_process_id: processId, stage: "ESO", grade: 1, group_code: "A", label: "1 ESO A", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoClassroomsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoClassroomsView processId={processId} />);
    expect(html).toContain('data-reparto-route="classrooms"');
    expect(html).toContain('data-reparto-table="classrooms"');
    expect(html).toContain('data-reparto-data-table="shared-registry"');
    expect(html).toContain('data-reparto-sort-column="stage"');
    expect(html).toContain('data-reparto-sort-column="grade"');
    expect(html).toContain('data-reparto-sort-column="group_code"');
    expect(html).toContain('data-reparto-sort-column="label"');
    expect(html).not.toContain('data-reparto-sort-column="actions"');
    expect(html).toMatch(/Actions<\/th><th[^>]*><button[^>]*data-reparto-sort-column="grade"/);
    expect(html).toContain('data-reparto-pagination="top"');
    expect(html).toContain('data-reparto-pagination="bottom"');
    expect(html).toContain("Search stage, group code, or label...");
    expect(html).toContain("1 ESO A");
    expect(html).toContain('data-classroom-stage="ESO"');
    expect(html).toContain('data-classroom-grade="1"');
  });

  it("requirements view renders classroom+subject labels per row and a create action", async () => {
    reset();
    queryState.groups = [
      { id: teachingGroupId, assignment_process_id: processId, stage: "ESO", grade: 1, group_code: "A", label: "1 ESO A", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.subjects = [
      { id: subjectId, assignment_process_id: processId, name: "Matemáticas", stage: "ESO", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.requirements = [
      { id: requirementId, assignment_process_id: processId, teaching_group_id: teachingGroupId, subject_id: subjectId, required_hours: 4, requirement_type: "ordinary", flags: null, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    const { RepartoHourRequirementsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoHourRequirementsView processId={processId} />);
    expect(html).toContain('data-reparto-route="requirements"');
    expect(html).toContain('data-reparto-table="requirements"');
    expect(html).toContain("1 ESO A");
    expect(html).toContain("Matemáticas");
  });

  it("requirements view disables Create with a missing-prerequisite reason when classrooms+subjects are empty (es locale)", async () => {
    reset();
    const { RepartoHourRequirementsView } = await import("../src/runtime/react/default-ui/index.js");
    const html = renderToStaticMarkup(<RepartoHourRequirementsView locale="es" processId={processId} />);
    expect(html).toContain('data-disabled-reason=');
    const createMatch = html.match(/<button[^>]*data-reparto-action="create"[^>]*>/);
    expect(createMatch?.[0]).toContain("disabled");
    expect(html).toContain('data-reparto-disabled-reason=""');
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
      { id: teachingGroupId, assignment_process_id: processId, stage: "ESO", grade: 1, group_code: "A", label: "1 ESO A", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.subjects = [
      { id: subjectId, assignment_process_id: processId, name: "Matemáticas", stage: "ESO", notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.teachers = [
      { id: profileId, display_name: "Profesora Ana", user_id: null, active: true, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
    ];
    queryState.requirements = [
      { id: requirementId, assignment_process_id: processId, teaching_group_id: teachingGroupId, subject_id: subjectId, required_hours: 4, requirement_type: "ordinary", flags: null, notes: null, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z" }
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
    expect(html).toContain("1 ESO A");
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

  it("requirement add form exposes one-level + Create new entries for classroom and subject selects (D-7 one-level)", async () => {
    reset();
    const { useDict } = await import("../src/runtime/react/default-ui/process-crud/shared.js");
    const dict = useDict("en");
    const { RequirementAdd } = await import("../src/runtime/react/default-ui/process-crud/requirements/add.js");
    const html = renderToStaticMarkup(
      <RequirementAdd dict={dict} processId={processId} onDone={() => undefined} />
    );
    const createNewCount = (html.match(/data-reparto-fk-action="create-new"/g) ?? []).length;
    expect(createNewCount).toBe(2);
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
  });
});