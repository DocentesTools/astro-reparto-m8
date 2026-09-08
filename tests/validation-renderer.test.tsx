import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { en } from "../src/runtime/i18n/en.js";
import { ProcessValidationList } from "../src/runtime/react/ProcessValidationList.js";

const validationConsumers = [
  "src/runtime/react/DepartmentHeadWorkspace.tsx",
  "src/runtime/react/default-ui/planning/plan-generation.tsx",
  "src/runtime/react/default-ui/process-crud/assignments/index.tsx",
  "src/runtime/react/default-ui/planning/feasibility-diagnostics.tsx"
];

describe("shared validation renderer", () => {
  it("keeps the machine code as data and out of visible copy", () => {
    const html = renderToStaticMarkup(
      <ProcessValidationList
        dict={en}
        listName="test-findings"
        messages={[
          {
            code: "plan.stale",
            details: <span>Catalog-authored detail</span>,
            entity_id: "11111111-1111-4111-8111-111111111111",
            entity_type: "teaching_plan",
            message: "The plan needs attention.",
            params: { status: "stale" },
            severity: "warning"
          }
        ]}
        stage="planning"
      />
    );

    expect(html).toContain('data-reparto-list="test-findings"');
    expect(html).toContain('data-reparto-validation-code="plan.stale"');
    expect(html).toContain('data-reparto-validation-entity="teaching_plan"');
    expect(html).toContain('data-reparto-validation-severity="warning"');
    expect(html).toContain("The plan is Stale and must be reconciled.");
    expect(html).not.toContain("The plan needs attention.");
    expect(html).toContain("Catalog-authored detail");
    expect(html).not.toContain(">plan.stale<");
  });

  it("uses the caller's empty text and retains the dashboard default", () => {
    const callerEmpty = renderToStaticMarkup(
      <ProcessValidationList
        dict={en}
        emptyMessage="Nothing blocks assignment."
        messages={[]}
        stage="assignment"
      />
    );
    const defaultEmpty = renderToStaticMarkup(
      <ProcessValidationList dict={en} messages={[]} stage="planning" />
    );

    expect(callerEmpty).toContain('data-reparto-slot="assignment-validations-empty"');
    expect(callerEmpty).toContain("Nothing blocks assignment.");
    expect(defaultEmpty).toContain(en.dashboard.state.noValidations);
  });

  it("is the only finding-markup implementation for all six mount points", () => {
    const renderer = readFileSync(
      resolve("src/runtime/react/ProcessValidationList.tsx"),
      "utf8"
    );
    const consumers = validationConsumers.map((file) =>
      readFileSync(resolve(file), "utf8")
    );
    const combinedConsumers = consumers.join("\n");
    const mountCount = consumers.reduce(
      (count, source) =>
        count + (source.match(/<ProcessValidationList\b/g) ?? []).length,
      0
    );

    expect(mountCount).toBe(6);
    expect(renderer.match(/data-reparto-validation-code=/g)).toHaveLength(1);
    expect(combinedConsumers).not.toContain("data-reparto-validation-code=");
    expect(combinedConsumers).not.toMatch(
      /data-(?:plan-)?validation-code=|data-feasibility-diagnostic-code=/
    );
  });
});
