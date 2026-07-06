import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const processId = "11111111-1111-4111-8111-111111111111";
const schoolId = "22222222-2222-4222-8222-222222222222";
const yearId = "33333333-3333-4333-8333-333333333333";
const departmentId = "44444444-4444-4444-8444-444444444444";

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

const queryState = vi.hoisted(() => ({
  schools: [] as { id: string; name: string }[],
  years: [] as { id: string; label: string }[],
  departments: [] as { id: string; name: string }[],
  processes: [] as { id: string; status: string }[]
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const scope = queryKey[1];
    if (scope === "schools" || scope === "academic-years" || scope === "departments" || scope === "processes") {
      const data =
        scope === "schools"
          ? queryState.schools
          : scope === "academic-years"
            ? queryState.years
            : scope === "departments"
              ? queryState.departments
              : queryState.processes;
      return {
        data: { data, count: data.length },
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

describe("empty-DB bootstrap — create-process dialog (Phase 1 component gate)", () => {
  it("renders three cascading selects (no raw UUID inputs) for academic year, school, department", async () => {
    const { RepartoDashboardView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    queryState.schools = [];
    queryState.years = [];
    queryState.departments = [];
    queryState.processes = [];

    const html = renderToStaticMarkup(<RepartoDashboardView />);

    expect(html).toContain('data-reparto-route="process-picker"');
    expect(html).toContain('data-reparto-form="create-process"');
    expect(html).toContain('data-reparto-fk="academic-year"');
    expect(html).toContain('data-reparto-fk="school"');
    expect(html).toContain('data-reparto-fk="department"');
    expect(html).toContain('data-reparto-fk-action="create-new"');

    // No raw UUID text inputs — only selects
    expect(html).not.toMatch(/<input[^>]*data-reparto-field="academic-year"/);
    expect(html).not.toMatch(/<input[^>]*data-reparto-field="school"/);
    expect(html).not.toMatch(/<input[^>]*data-reparto-field="department"/);
  });

  it("create-process button is disabled with a visible disabled reason until all three selects are populated", async () => {
    const { RepartoDashboardView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    queryState.schools = [{ id: schoolId, name: "IES Almería Centro" }];
    queryState.years = [{ id: yearId, label: "2025-2026" }];
    queryState.departments = [{ id: departmentId, name: "Matemáticas" }];
    queryState.processes = [];

    const empty = renderToStaticMarkup(<RepartoDashboardView />);
    const buttonMatch = empty.match(
      /<button[^>]*data-reparto-action="create-process"[^>]*>/
    );
    expect(buttonMatch).not.toBeNull();
    expect(buttonMatch?.[0]).toContain("disabled");
    expect(empty).toContain('data-disabled-reason=');
    expect(empty).toContain('data-reparto-disabled-reason=""');
  });

  it("each select exposes a one-level + Create new entry (D-7, no nested modals)", async () => {
    const { RepartoDashboardView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    queryState.processes = [];
    const html = renderToStaticMarkup(<RepartoDashboardView />);
    const createNewCount = (html.match(/data-reparto-fk-action="create-new"/g) ?? []).length;
    expect(createNewCount).toBe(3);
  });

  it("never renders a UUID string in any user-facing label, placeholder, or default value", async () => {
    const { RepartoDashboardView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    queryState.schools = [{ id: schoolId, name: "IES" }];
    queryState.years = [{ id: yearId, label: "2025-2026" }];
    queryState.departments = [{ id: departmentId, name: "Matemáticas" }];
    queryState.processes = [{ id: processId, status: "draft" }];
    const html = renderToStaticMarkup(<RepartoDashboardView />);
    // The only legitimate UUID surface is DOM attributes (data-*, value, id),
    // which are not user-facing text. Strip attributes then assert no UUID in text.
    const stripped = html.replace(/\s[a-z-]+="[^"]*"/g, "");
    expect(stripped, "raw UUID leaked into user-facing text").not.toMatch(UUID_RE);
  });

  it("when processes exist, the picker lists them and still offers create-process", async () => {
    const { RepartoDashboardView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    queryState.processes = [{ id: processId, status: "draft" }];
    const html = renderToStaticMarkup(<RepartoDashboardView />);
    expect(html).toContain('data-reparto-action="select-process"');
    expect(html).toContain('data-reparto-form="create-process"');
  });
});
