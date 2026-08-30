// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";
import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";

/**
 * The claim-code flow, from both ends (`W1.4`).
 *
 * The roster's *Link user* linked `currentUserId`, so a head pressing it on a
 * colleague's row linked **themselves**; and *My view* answered a teacher with
 * no linkage by rendering the service's 404 string and stopping there. Neither
 * could be fixed by looking a user id up — `fa-auth-m8` owns the accounts
 * directory and restricts it to superusers by its own design (`C1`).
 *
 * So what these assert is the reversal: the head issues a code and never sees
 * an id, the code is shown once and copyably, a linked row offers *Unlink*
 * rather than a button that would steal the linkage, and the teacher's dead end
 * is now the form that ends it — carrying the code and nothing else, because
 * the account it binds comes from the token.
 */

const ownProfileId = "11111111-1111-4111-8111-111111111111";
const processId = "22222222-2222-4222-8222-222222222222";

const dict = getRepartoDictionary("en");

const mutationState = vi.hoisted(() => ({
  issued: [] as string[],
  claimed: [] as { claim_code: string }[],
  issueResult: null as unknown,
  claimError: null as unknown,
  claimResult: { display_name: "Ada Lovelace" } as unknown
}));

const queryState = vi.hoisted(() => ({
  teachers: [] as {
    id: string;
    display_name: string;
    user_id: string | null;
    active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }[],
  lanError: null as unknown
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const scope = queryKey[1];
    if (scope === "teacher-profiles") {
      return {
        data: { data: queryState.teachers, count: queryState.teachers.length },
        error: null,
        isError: false,
        isLoading: false
      };
    }
    if (queryKey.includes("teacher-lan")) {
      return {
        data: undefined,
        error: queryState.lanError,
        isError: Boolean(queryState.lanError),
        isLoading: false
      };
    }
    return { data: undefined, error: null, isError: false, isLoading: false };
  },
  // One fake mutation stands for both hooks: which one it is is read from the
  // argument shape, the same way the callers differ — the mint takes a profile
  // id, the claim takes a body carrying only the code.
  useMutation: ({
    mutationFn
  }: {
    mutationFn: (input: unknown) => unknown;
  }) => ({
    isPending: false,
    isError: false,
    error: null,
    mutate: (
      input: unknown,
      handlers?: {
        onSuccess?: (value: unknown) => void;
        onError?: (error: unknown) => void;
      }
    ) => {
      void mutationFn;
      if (typeof input === "string") {
        mutationState.issued.push(input);
        handlers?.onSuccess?.(mutationState.issueResult);
        return;
      }
      mutationState.claimed.push(input as { claim_code: string });
      if (mutationState.claimError) {
        handlers?.onError?.(mutationState.claimError);
        return;
      }
      handlers?.onSuccess?.(mutationState.claimResult);
    }
  }),
  useQueryClient: () => ({ invalidateQueries: () => undefined })
}));

function teacherProfile(id: string, displayName: string, userId: string | null) {
  return {
    id,
    display_name: displayName,
    user_id: userId,
    active: true,
    notes: null,
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z"
  };
}

beforeEach(() => {
  mutationState.issued = [];
  mutationState.claimed = [];
  mutationState.issueResult = {
    teacher_profile_id: ownProfileId,
    display_name: "Ada Lovelace",
    claim_code: "ABCDE-FGHJK-MNPQR-STVWX",
    expires_at: "2026-09-01T10:00:00Z"
  };
  mutationState.claimError = null;
  mutationState.claimResult = { display_name: "Ada Lovelace" };
  queryState.teachers = [teacherProfile(ownProfileId, "Ada Lovelace", null)];
  queryState.lanError = null;
  signInReparto(repartoUser("admin"));
});

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
});

describe("teacher roster — issuing a claim code", () => {
  it("mints for the row pressed, and shows the code once", async () => {
    const { RepartoTeacherRosterView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const view = render(<RepartoTeacherRosterView />);

    fireEvent.click(
      view.container.querySelector('[data-reparto-action="issue-claim-code"]')!
    );

    // The profile id, and no user id anywhere: nothing on this path needs to
    // know which account will end up holding the profile.
    expect(mutationState.issued).toEqual([ownProfileId]);
    const shown = view.baseElement.querySelector('[data-reparto-slot="claim-code"]');
    expect(shown?.textContent).toBe("ABCDE-FGHJK-MNPQR-STVWX");
    expect(view.baseElement.textContent).toContain("Ada Lovelace");
  });

  it("copies the code when the host has a clipboard", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    const { RepartoTeacherRosterView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const view = render(<RepartoTeacherRosterView />);
    fireEvent.click(
      view.container.querySelector('[data-reparto-action="issue-claim-code"]')!
    );

    fireEvent.click(
      view.baseElement.querySelector('[data-reparto-action="copy-claim-code"]')!
    );
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("ABCDE-FGHJK-MNPQR-STVWX");
  });

  it("survives a host with no clipboard at all", async () => {
    // An insecure origin has no `navigator.clipboard`. The code is on screen
    // and selectable either way, so this is a missing convenience — never an
    // unhandled rejection.
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined
    });
    const { RepartoTeacherRosterView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const view = render(<RepartoTeacherRosterView />);
    fireEvent.click(
      view.container.querySelector('[data-reparto-action="issue-claim-code"]')!
    );

    expect(() =>
      fireEvent.click(
        view.baseElement.querySelector('[data-reparto-action="copy-claim-code"]')!
      )
    ).not.toThrow();
    expect(
      view.baseElement.querySelector('[data-reparto-slot="claim-code-copied"]')
    ).toBeNull();
  });

  it("offers no claim code on a row that is already linked", async () => {
    queryState.teachers = [
      teacherProfile(ownProfileId, "Ada Lovelace", "00000000-0000-4000-8000-0000000000aa")
    ];
    const { RepartoTeacherRosterView } = await import(
      "../src/runtime/react/default-ui/setup-crud.js"
    );
    const view = render(<RepartoTeacherRosterView />);

    expect(
      view.container.querySelector('[data-reparto-action="issue-claim-code"]')
    ).toBeNull();
    expect(
      view.container.querySelector('[data-reparto-action="unlink-user"]')
    ).not.toBeNull();
  });
});

describe("my view — claiming a profile", () => {
  async function renderMyView() {
    const { RepartoMyView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );
    return render(<RepartoMyView processId={processId} />);
  }

  it("replaces the dead end with a claim form when nothing is linked", async () => {
    queryState.lanError = new RepartoApiError(
      404,
      "No teacher profile is linked to this auth user."
    );
    const view = await renderMyView();

    expect(
      view.container.querySelector('[data-reparto-panel="teacher-claim"]')
    ).not.toBeNull();
    expect(view.container.textContent).toContain(dict.view.claim.title);
    expect(view.container.textContent).not.toContain(
      "No teacher profile is linked to this auth user."
    );
  });

  it("sends the code and nothing else, then names what it linked", async () => {
    queryState.lanError = new RepartoApiError(404, "not linked");
    const view = await renderMyView();

    fireEvent.change(view.container.querySelector("#reparto-claim-code")!, {
      target: { value: " abcde-fghjk-mnpqr-stvwx " }
    });
    fireEvent.click(
      view.container.querySelector('[data-reparto-action="claim-profile"]')!
    );

    // Trimmed, but otherwise untouched — case and dashes are the service's to
    // normalise — and carrying no account of any kind.
    expect(mutationState.claimed).toEqual([
      { claim_code: "abcde-fghjk-mnpqr-stvwx" }
    ]);
    expect(
      view.container.querySelector('[data-reparto-slot="claim-linked"]')
        ?.textContent
    ).toContain("Ada Lovelace");
  });

  it("keeps the action shut until a code is typed", async () => {
    queryState.lanError = new RepartoApiError(404, "not linked");
    const view = await renderMyView();
    const submit = view.container.querySelector<HTMLButtonElement>(
      '[data-reparto-action="claim-profile"]'
    )!;

    expect(submit.disabled).toBe(true);
    fireEvent.change(view.container.querySelector("#reparto-claim-code")!, {
      target: { value: "   " }
    });
    expect(submit.disabled).toBe(true);
    expect(mutationState.claimed).toEqual([]);
  });

  it("renders a refusal instead of swallowing it", async () => {
    queryState.lanError = new RepartoApiError(404, "not linked");
    mutationState.claimError = new RepartoApiError(
      400,
      "Claim code is not valid, or has expired or been used."
    );
    const view = await renderMyView();

    fireEvent.change(view.container.querySelector("#reparto-claim-code")!, {
      target: { value: "WRONG" }
    });
    fireEvent.click(
      view.container.querySelector('[data-reparto-action="claim-profile"]')!
    );

    expect(
      view.container.querySelector('[data-reparto-slot="form-error"]')
        ?.textContent
    ).toContain("Claim code is not valid");
    expect(
      view.container.querySelector('[data-reparto-slot="claim-linked"]')
    ).toBeNull();
  });

  it("leaves a failure that is not a missing linkage alone", async () => {
    // A 500 is a fault, not a recourse: offering a claim form for it would
    // tell the teacher to fix something that is not theirs to fix.
    queryState.lanError = new RepartoApiError(500, "boom");
    const view = await renderMyView();

    expect(
      view.container.querySelector('[data-reparto-panel="teacher-claim"]')
    ).toBeNull();
    expect(view.container.querySelector('[data-reparto-state="error"]')).not.toBeNull();
  });
});
