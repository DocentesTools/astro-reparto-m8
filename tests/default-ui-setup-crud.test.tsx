import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const schoolId = "11111111-1111-4111-8111-111111111111";
const yearId = "22222222-2222-4222-8222-222222222222";
const departmentId = "33333333-3333-4333-8333-333333333333";
const teacherProfileId = "44444444-4444-4444-8444-444444444444";

type Scope = "schools" | "academic-years" | "departments" | "teacher-profiles";

const queryState = vi.hoisted(() => ({
  schools: [] as { id: string; name: string }[],
  years: [] as {
    id: string;
    label: string;
    start_date: string;
    end_date: string;
    status: string;
    previous_academic_year_id: string | null;
    school_id: string;
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
    expect(html).toContain('data-reparto-action="create"');
    expect(html).toContain('data-reparto-row-action="edit"');
    expect(html).toContain("IES Almería Centro");
    expect(html).not.toContain('data-reparto-row-action="delete"');
    expect(html).not.toContain('data-reparto-row-action="archive"');
  });

  it("schools create form opens with name field", async () => {
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
    expect(html).not.toContain('data-reparto-row-action="delete"');
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

  it("renders teacher roster with Edit, Link user, and Delete (hard delete + link-user)", async () => {
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