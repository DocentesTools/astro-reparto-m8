import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RepartoProvider, useRepartoContext } from "../src/runtime/react/index.js";
import {
  DepartmentHeadView,
  ProcessesView,
  RepartoVersionsView
} from "../src/runtime/react/default-ui/index.js";

function ContextReader() {
  const context = useRepartoContext();
  return <span data-api-base={context.config?.apiBase} />;
}

describe("default reparto UI", () => {
  it("renders the department-head MVP workflow panels", () => {
    const html = renderToStaticMarkup(
      <DepartmentHeadView config={{ apiBase: "/api", apiPrefix: "/reparto" }} />
    );

    expect(html).toContain('data-reparto-panel="setup-wizard"');
    expect(html).toContain('data-reparto-panel="teachers-view"');
    expect(html).toContain('data-reparto-panel="required-hours"');
    expect(html).toContain('data-reparto-panel="manual-assignment-board"');
    expect(html).toContain('data-reparto-panel="validation-summary"');
    expect(html).toContain('data-reparto-action="record-override"');
  });

  it("renders prompt-style starter views for process and version routes", () => {
    expect(renderToStaticMarkup(<ProcessesView />)).toContain(
      'data-reparto-action="create-process"'
    );
    const versions = renderToStaticMarkup(<RepartoVersionsView />);
    expect(versions).toContain('data-reparto-action="create-version"');
    expect(versions).toContain('data-reparto-action="compare-versions"');
  });

  it("exposes reparto context inside the provider", () => {
    const html = renderToStaticMarkup(
      <RepartoProvider config={{ apiBase: "/custom" }}>
        <ContextReader />
      </RepartoProvider>
    );
    expect(html).toContain('data-api-base="/custom"');
    expect(() => renderToStaticMarkup(<ContextReader />)).toThrow(
      "useRepartoContext must be used inside RepartoProvider"
    );
  });
});
