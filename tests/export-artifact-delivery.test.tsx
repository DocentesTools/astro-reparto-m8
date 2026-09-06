// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  exportArtifactFilename,
  exportArtifactMimeType
} from "../src/runtime/ui/index.js";
import type { ExportArtifactPublic } from "../src/runtime/schemas.js";
import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";

/**
 * Getting a produced document *into the reader's hands* (plan §15).
 *
 * `default-ui.test.tsx` proves the two affordances render. What is proven here
 * is the half that was missing entirely until this release and that no markup
 * assertion can see: pressing them actually hands the content over. The centre
 * used to answer a successful export with a toast and nothing else — the
 * document was written, checksummed and stored, and the head had no way to
 * read it.
 *
 * The revocation timing is asserted deliberately. `a.click()` only *starts* a
 * save and `window.open` hands the URL to a document that has not loaded yet,
 * so revoking the blob URL in the same tick cancels the very thing the click
 * was for — a failure that leaves the UI looking like it worked, which is
 * exactly the shape of the bug this suite exists to catch.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const now = "2026-09-05T10:00:00Z";

const documentArtifact: ExportArtifactPublic = {
  id: "99999999-9999-4999-8999-999999999999",
  assignment_process_id: processId,
  process_version_id: null,
  export_type: "internal_draft",
  format: "pdf",
  file_path: "exports/internal_draft.pdf",
  created_by_user_id: "88888888-8888-4888-8888-888888888888",
  checksum: "a".repeat(64),
  content: "REPARTO — INTERNAL DRAFT\n========================\n",
  created_at: now,
  updated_at: now
};

const objectUrls = vi.hoisted(() => ({
  create: vi.fn(),
  revoke: vi.fn(),
  open: vi.fn()
}));

const emptyQuery = { data: undefined, error: null, isError: false, isLoading: false };
const idleMutation = { isPending: false, mutate: vi.fn() };

// Every hook the export route's own tree reaches — the centre's five reads and
// four mutations, plus the reads the route guard's checklist button and the
// process context make. The view is handed its `artifacts` directly, so none
// of them needs to answer with anything.
vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoExports: () => emptyQuery,
  useRepartoTeachingPlan: () => emptyQuery,
  useRepartoTeachingPlanValidations: () => emptyQuery,
  useRepartoAssignmentValidations: () => emptyQuery,
  useRepartoProcess: () => emptyQuery,
  useRepartoProcesses: () => emptyQuery,
  useRepartoSchools: () => emptyQuery,
  useRepartoAcademicYears: () => emptyQuery,
  useRepartoDepartments: () => emptyQuery,
  useRepartoSetupObservations: () => emptyQuery,
  useRepartoSummary: () => emptyQuery,
  useCreateRepartoPlanningExport: () => idleMutation,
  useCreateRepartoExportArtifact: () => idleMutation,
  useImportRepartoPlanning: () => idleMutation,
  useRestoreRepartoDraft: () => idleMutation,
  useCreateRepartoProcess: () => idleMutation,
  useCreateRepartoSchool: () => idleMutation
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: { success: vi.fn(), error: vi.fn() },
  RepartoToastHost: () => null
}));

const { RepartoExportsView } = await import(
  "../src/runtime/react/default-ui/index.js"
);

function pressArtifactAction(action: string) {
  const button = document.querySelector(
    `[data-reparto-action="${action}"][data-reparto-export-artifact-id="${documentArtifact.id}"]`
  );
  if (button === null) throw new Error(`no ${action} control`);
  fireEvent.click(button);
}

beforeEach(() => {
  signInReparto(repartoUser("admin"));
  objectUrls.create.mockReturnValue("blob:reparto/artifact");
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: objectUrls.create,
    revokeObjectURL: objectUrls.revoke
  });
  vi.stubGlobal("open", objectUrls.open);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  resetRepartoAuthAdapter();
  cleanup();
});

describe("handing a produced export document to the reader", () => {
  it("saves the artifact under a name and type that match its content", () => {
    render(
      <RepartoExportsView artifacts={[documentArtifact]} processId={processId} />
    );

    const clicked: HTMLAnchorElement[] = [];
    const realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patched(this: HTMLAnchorElement) {
      clicked.push(this);
    };
    try {
      pressArtifactAction("download-export");
    } finally {
      HTMLAnchorElement.prototype.click = realClick;
    }

    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe(exportArtifactFilename(documentArtifact));
    // A plan §15 document is text under a `pdf` label, so it is saved as the
    // text it is rather than as bytes no viewer could open.
    expect(clicked[0].download).toMatch(/\.txt$/);
    const [blob] = objectUrls.create.mock.calls[0] as [Blob];
    expect(blob.type).toBe(exportArtifactMimeType(documentArtifact.format));
    expect(blob.type).toBe("text/plain");

    // The anchor is not left behind in the document it was appended to.
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("opens the artifact for reading without filing it", () => {
    render(
      <RepartoExportsView artifacts={[documentArtifact]} processId={processId} />
    );

    pressArtifactAction("view-export");

    expect(objectUrls.open).toHaveBeenCalledWith(
      "blob:reparto/artifact",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("outlives the click before revoking the URL it just handed out", () => {
    render(
      <RepartoExportsView artifacts={[documentArtifact]} processId={processId} />
    );

    pressArtifactAction("download-export");

    // The whole point: revoking in the same tick cancels the save, and the UI
    // still looks like it worked.
    expect(objectUrls.revoke).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(objectUrls.revoke).toHaveBeenCalledWith("blob:reparto/artifact");
  });
});
