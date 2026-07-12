import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("radix-ui", () => {
  const Root = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const Portal = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const Close = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const Title = ({ children, className }: { children?: ReactNode; className?: string }) => <h2 className={className}>{children}</h2>;
  const Description = ({ children, className }: { children?: ReactNode; className?: string }) => <p className={className}>{children}</p>;
  const DialogOverlay = ({ className }: { className?: string }) => <div className={className} data-slot="dialog-overlay" />;
  const DialogContent = ({ children, className }: { children?: ReactNode; className?: string }) => <section className={className} role="dialog">{children}</section>;
  const AlertOverlay = ({ className }: { className?: string }) => <div className={className} data-slot="alert-dialog-overlay" />;
  const AlertContent = ({ children, className }: { children?: ReactNode; className?: string }) => <section className={className} role="alertdialog">{children}</section>;
  return {
    Dialog: { Root, Portal, Close, Title, Description, Overlay: DialogOverlay, Content: DialogContent },
    AlertDialog: { Root, Portal, Title, Overlay: AlertOverlay, Content: AlertContent }
  };
});

import { ClassroomDialogShell } from "../src/runtime/react/default-ui/process-crud/classrooms/dialog-shell.js";

describe("classroom CRUD dialog shell", () => {
  it("uses the shadcn Dialog structure for create and edit forms", () => {
    const html = renderToStaticMarkup(
      <ClassroomDialogShell description="Classrooms" dialogId="classroom-edit" onClose={vi.fn()} title="Edit classroom">
        <form>Fields</form>
      </ClassroomDialogShell>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('data-slot="dialog-overlay"');
    expect(html).toContain('data-reparto-dialog="classroom-edit"');
    expect(html).toContain('data-reparto-dialog-dismiss="close"');
    expect(html).toContain("sm:max-w-2xl");
    expect(html).toContain("bg-black/10");
    expect(html).toContain("p-4");
    expect(html).not.toContain("style=");
    expect(html).toContain("Edit classroom");
    expect(html).toContain("<form>Fields</form>");
  });

  it("uses the shared alert-dialog recipe for delete confirmation", () => {
    const source = readFileSync(
      resolve("src/runtime/react/default-ui/process-crud/classrooms/delete.tsx"),
      "utf8"
    );

    for (const component of [
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogFooter",
      "AlertDialogCancel",
      "AlertDialogAction"
    ]) {
      expect(source).toContain(component);
    }
    expect(source).not.toContain("ConfirmDelete");
  });
});
