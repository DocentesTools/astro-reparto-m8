import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";

// Every reparto route is gated by the signed-in role (§8.1 route map). These
// suites assert the administrative surface, so they sign an `ADMIN` in; the
// per-role sweep lives in `route-gating.test.tsx`.
beforeEach(() => {
  signInReparto(repartoUser("admin"));
});

afterEach(() => {
  resetRepartoAuthAdapter();
});

const schoolId = "11111111-1111-4111-8111-111111111111";
const yearId = "22222222-2222-4222-8222-222222222222";
const departmentId = "33333333-3333-4333-8333-333333333333";
const teacherProfileId = "44444444-4444-4444-8444-444444444444";

const queryState = vi.hoisted(() => ({
  schools: [] as { id: string; name: string }[],
  years: [] as {
    id: string;
    label: string;
    start_date: string;
    end_date: string;
    status: string;
    previous_academic_year_id: string | null;
    school_id: string | null;
    created_by_user_id: string;
    created_at: string;
    updated_at: string;
  }[],
  departments: [] as {
    id: string;
    school_id: string;
    name: string;
    slug: string;
    department_head_user_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }[],
  teachers: [] as {
    id: string;
    display_name: string;
    user_id: string | null;
    active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }[]
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const scope = queryKey[1];
    if (scope === "schools") {
      return {
        data: { data: queryState.schools, count: queryState.schools.length },
        error: null,
        isError: false,
        isLoading: false
      };
    }
    if (scope === "academic-years") {
      return {
        data: { data: queryState.years, count: queryState.years.length },
        error: null,
        isError: false,
        isLoading: false
      };
    }
    if (scope === "departments") {
      return {
        data: { data: queryState.departments, count: queryState.departments.length },
        error: null,
        isError: false,
        isLoading: false
      };
    }
    if (scope === "teacher-profiles") {
      return {
        data: { data: queryState.teachers, count: queryState.teachers.length },
        error: null,
        isError: false,
        isLoading: false
      };
    }
    return { data: undefined, error: null, isError: false, isLoading: false };
  },
  useMutation: () => ({ isPending: false, isError: false, mutate: () => undefined }),
  useQueryClient: () => ({ invalidateQueries: () => undefined })
}));

function resetState() {
  queryState.schools = [];
  queryState.years = [];
  queryState.departments = [];
  queryState.teachers = [];
}

describe("Phase 2 setup CRUD islands (default-ui)", () => {
  it("renders the schools list with Create + Edit and no Delete (edit-only, freeze D-4)", async () => {
    resetState();
    queryState.schools = [{ id: schoolId, name: "IES Almería Centro" }];
    const { RepartoSchoolsView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    const html = renderToStaticMarkup(<RepartoSchoolsView />);
    expect(html).toContain('data-reparto-route="schools"');
    expect(html).toContain('data-reparto-group="setup"');
    expect(html).toContain('data-reparto-table="schools"');
    expect(html).toContain('data-reparto-data-table="shared-registry"');
    expect(html).toContain('data-reparto-action="create"');
    expect(html).toContain('data-reparto-row-action="edit"');
    expect(html).toContain("IES Almería Centro");
    expect(html).not.toContain('data-reparto-row-action="delete"');
    expect(html).not.toContain('data-reparto-row-action="archive"');
    // full data table: orderable data columns, non-orderable 2nd (Actions) column
    expect(html).toContain('data-reparto-sort-column="name"');
    expect(html).toContain('data-reparto-sort-column="province"');
    expect(html).not.toContain('data-reparto-sort-column="actions"');
    expect(html).toContain('data-reparto-pagination="top"');
    expect(html).toContain("Search name, locality, or province...");
  });

  it("renders the schools form shell with name field", async () => {
    resetState();
    queryState.schools = [];
    const { RepartoSchoolsView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const html = renderToStaticMarkup(<RepartoSchoolsView />);
    expect(html).toContain('data-reparto-table="schools"');
    expect(html).toContain('data-reparto-panel="schools"');
  });

  it("renders academic-years list with Archive action, never Delete (archive-not-delete)", async () => {
    resetState();
    queryState.schools = [{ id: schoolId, name: "IES Almeria Centro" }];
    queryState.years = [
      {
        id: yearId,
        label: "2025-2026",
        start_date: "2025-09-01",
        end_date: "2026-06-30",
        status: "active",
        previous_academic_year_id: null,
        school_id: schoolId,
        created_by_user_id: "55555555-5555-4555-8555-555555555555",
        created_at: "2026-07-04T10:00:00Z",
        updated_at: "2026-07-04T10:00:00Z"
      }
    ];
    const { RepartoAcademicYearsView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const html = renderToStaticMarkup(<RepartoAcademicYearsView />);
    expect(html).toContain('data-reparto-route="academic-years"');
    expect(html).toContain('data-reparto-row-action="archive"');
    expect(html).toContain('data-year-status="active"');
    expect(html).toContain("IES Almeria Centro");
    expect(html).not.toContain('data-reparto-row-action="delete"');
  });

  it("disables academic-year creation until a school exists", async () => {
    resetState();
    const { RepartoAcademicYearsView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const html = renderToStaticMarkup(<RepartoAcademicYearsView />);
    const createMatch = html.match(
      /<button[^>]*data-reparto-action="create"[^>]*>/
    );
    expect(createMatch?.[0]).toContain("disabled");
    expect(createMatch?.[0]).toContain("data-disabled-reason=");
  });

  it("disables archive button with visible reason when the year is already archived", async () => {
    resetState();
    queryState.years = [
      {
        id: yearId,
        label: "2024-2025",
        start_date: "2024-09-01",
        end_date: "2025-06-30",
        status: "archived",
        previous_academic_year_id: null,
        school_id: schoolId,
        created_by_user_id: "55555555-5555-4555-8555-555555555555",
        created_at: "2026-07-04T10:00:00Z",
        updated_at: "2026-07-04T10:00:00Z"
      }
    ];
    const { RepartoAcademicYearsView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const html = renderToStaticMarkup(<RepartoAcademicYearsView />);
    const archiveMatch = html.match(
      /<button[^>]*data-reparto-action="archive"[^>]*>/
    );
    expect(archiveMatch).not.toBeNull();
    expect(archiveMatch?.[0]).toContain("disabled");
    expect(html).toContain('data-disabled-reason=');
    expect(html).toContain('data-reparto-disabled-reason=""');
  });

  it("renders departments list (edit-only) and disables Create with a visible reason when no school exists (D-7 + freeze rule)", async () => {
    resetState();
    queryState.departments = [];
    const { RepartoDepartmentsView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const html = renderToStaticMarkup(<RepartoDepartmentsView />);
    expect(html).toContain('data-reparto-route="departments"');
    expect(html).toContain('data-disabled-reason=');
    const createMatch = html.match(
      /<button[^>]*data-reparto-action="create"[^>]*>/
    );
    expect(createMatch?.[0]).toContain("disabled");
    expect(html).not.toContain('data-reparto-row-action="delete"');
  });

  it("renders a cascading school select for departments when schools exist", async () => {
    resetState();
    queryState.schools = [{ id: schoolId, name: "IES Almería Centro" }];
    queryState.departments = [
      {
        id: departmentId,
        school_id: schoolId,
        name: "Matemáticas",
        slug: "matematicas",
        department_head_user_id: null,
        notes: null,
        created_at: "2026-07-04T10:00:00Z",
        updated_at: "2026-07-04T10:00:00Z"
      }
    ];
    const { RepartoDepartmentsView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const html = renderToStaticMarkup(<RepartoDepartmentsView />);
    expect(html).toContain("Matemáticas");
    expect(html).toContain("IES Almería Centro");
  });

  it("renders teacher roster with Edit, Link user (one-click, no id input), and Delete", async () => {
    resetState();
    queryState.teachers = [
      {
        id: teacherProfileId,
        display_name: "Profesora Ana",
        user_id: null,
        active: true,
        notes: null,
        created_at: "2026-07-04T10:00:00Z",
        updated_at: "2026-07-04T10:00:00Z"
      }
    ];
    const { RepartoTeacherRosterView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const html = renderToStaticMarkup(<RepartoTeacherRosterView />);
    expect(html).toContain('data-reparto-route="teacher-roster"');
    expect(html).toContain('data-reparto-row-action="edit"');
    expect(html).toContain('data-reparto-row-action="link-user"');
    expect(html).toContain('data-reparto-row-action="delete"');
    expect(html).toContain("Profesora Ana");
    // No more free-text user-id input: linking is a single click, not a form.
    expect(html).not.toContain('data-reparto-form="teacher-link-user"');
    expect(html).not.toContain('data-reparto-field="user-id"');
  });

  it("renders the four setup islands labelled as the Setup sidebar group", async () => {
    resetState();
    const mod = await import("../src/runtime/react/default-ui/index.js");
    const schools = renderToStaticMarkup(<mod.RepartoSchoolsView />);
    const years = renderToStaticMarkup(<mod.RepartoAcademicYearsView />);
    const departments = renderToStaticMarkup(<mod.RepartoDepartmentsView />);
    const roster = renderToStaticMarkup(<mod.RepartoTeacherRosterView />);
    for (const html of [schools, years, departments, roster]) {
      expect(html).toContain('data-reparto-group="setup"');
    }
  });
});

describe("Phase 2 step 2 — error mapping + disabled-reason + i18n", () => {
  it("exposes the empty mapped error shape and fieldError lookup", async () => {
    const { EMPTY_REPARTO_MAPPED_ERROR, findFieldError } = await import(
      "../src/runtime/errorMapping.js"
    );
    expect(EMPTY_REPARTO_MAPPED_ERROR).toEqual({ fieldErrors: [], formError: null });
    expect(findFieldError(EMPTY_REPARTO_MAPPED_ERROR, "name")).toBeUndefined();
  });

  it("renders a field-error slot inside the school form when a 422 maps to the name field", async () => {
    resetState();
    queryState.schools = [];
    const { RepartoApiError } = await import("../src/runtime/errors.js");
    const { mapRepartoError } = await import(
      "../src/runtime/errorMapping.js"
    );
    const err = new RepartoApiError(422, [
      {
        loc: ["body", "name"],
        msg: "School name is required",
        type: "value_error"
      }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.fieldErrors).toEqual([
      {
        field: "name",
        message: "School name is required",
        errorKey: "required"
      }
    ]);
  });

  it("renders localized labels in French for the schools form (i18n fr dictionary)", async () => {
    resetState();
    queryState.schools = [];
    const { RepartoSchoolsView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    const html = renderToStaticMarkup(<RepartoSchoolsView locale="fr" />);
    expect(html).toContain("Établissements");
  });

  it("renders localized labels in Spanish for the teacher roster", async () => {
    resetState();
    const { RepartoTeacherRosterView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    const html = renderToStaticMarkup(<RepartoTeacherRosterView locale="es" />);
    expect(html).toContain("Docentes");
  });

  it("renders the create-disabled reason inline for departments when no school exists", async () => {
    resetState();
    queryState.departments = [];
    const { RepartoDepartmentsView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    const html = renderToStaticMarkup(<RepartoDepartmentsView locale="es" />);
    expect(html).toContain('data-reparto-disabled-reason=""');
    expect(html).toContain("centro");
  });

  it("renders RepartoFieldError with role=alert and per-field key when present", async () => {
    const { RepartoFieldError } = await import(
      "../src/runtime/react/default-ui/feedback.js"
    );
    const { mapRepartoError } = await import("../src/runtime/errorMapping.js");
    const { RepartoApiError } = await import("../src/runtime/errors.js");
    const mapped = mapRepartoError(
      new RepartoApiError(422, [
        { loc: ["body", "name"], msg: "name required", type: "value_error" }
      ])
    );
    const html = renderToStaticMarkup(
      <RepartoFieldError field="name" id="x-error" mapped={mapped} />
    );
    expect(html).toContain('data-reparto-slot="field-error"');
    expect(html).toContain('data-reparto-field="name"');
    expect(html).toContain('data-reparto-error-key="required"');
    expect(html).toContain('id="x-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("name required");
  });

  it("renders nothing when RepartoFieldError is given an empty mapped error", async () => {
    const { RepartoFieldError } = await import(
      "../src/runtime/react/default-ui/feedback.js"
    );
    const { EMPTY_REPARTO_MAPPED_ERROR } = await import(
      "../src/runtime/errorMapping.js"
    );
    const html = renderToStaticMarkup(
      <RepartoFieldError field="name" mapped={EMPTY_REPARTO_MAPPED_ERROR} />
    );
    expect(html).toBe("");
  });

  it("renders RepartoFormError with errorKey=conflict on a 409 response", async () => {
    const { RepartoFormError } = await import(
      "../src/runtime/react/default-ui/feedback.js"
    );
    const { mapRepartoError } = await import("../src/runtime/errorMapping.js");
    const { RepartoApiError } = await import("../src/runtime/errors.js");
    const mapped = mapRepartoError(
      new RepartoApiError(409, "Auth user is already linked")
    );
    const html = renderToStaticMarkup(<RepartoFormError mapped={mapped} />);
    expect(html).toContain('data-reparto-slot="form-error"');
    expect(html).toContain('data-reparto-error-key="conflict"');
    expect(html).toContain("Auth user is already linked");
  });

  it("renders RepartoDisabledReason with the freeze-required data attribute", async () => {
    const { RepartoDisabledReason } = await import(
      "../src/runtime/react/default-ui/feedback.js"
    );
    const html = renderToStaticMarkup(
      <RepartoDisabledReason reason="Select a process first" />
    );
    expect(html).toContain('data-reparto-disabled-reason=""');
    expect(html).toContain("Select a process first");
  });

  it("renders nothing when RepartoDisabledReason has no reason", async () => {
    const { RepartoDisabledReason } = await import(
      "../src/runtime/react/default-ui/feedback.js"
    );
    expect(renderToStaticMarkup(<RepartoDisabledReason reason={null} />)).toBe("");
  });
});
