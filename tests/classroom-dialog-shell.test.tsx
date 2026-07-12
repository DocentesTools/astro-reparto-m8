import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ClassroomDialogShell } from "../src/runtime/react/default-ui/process-crud/classrooms/dialog-shell.js";

describe("classroom CRUD dialog shell", () => {
  it("renders create and edit forms as modal dialogs", () => {
    const html = renderToStaticMarkup(
      <ClassroomDialogShell
        description="Classrooms"
        dialogId="classroom-edit"
        onClose={vi.fn()}
        title="Edit classroom"
      >
        <form>Fields</form>
      </ClassroomDialogShell>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('data-reparto-dialog="classroom-edit"');
    expect(html).toContain('data-reparto-dialog-dismiss="backdrop"');
    expect(html).toContain('data-reparto-dialog-dismiss="close"');
    expect(html).toContain("Edit classroom");
    expect(html).toContain("<form>Fields</form>");
  });

  it("renders delete confirmation as an alert dialog", () => {
    const html = renderToStaticMarkup(
      <ClassroomDialogShell
        dialogId="classroom-delete"
        hideHeader
        onClose={vi.fn()}
        title="Delete classroom?"
        variant="alertdialog"
      >
        Confirmation
      </ClassroomDialogShell>
    );

    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-label="Delete classroom?"');
    expect(html).not.toContain('id="classroom-delete-title"');
  });
});
