import { useState } from "react";

import {
  RepartoAcademicYearsView,
  RepartoDepartmentsView,
  RepartoProcessesView,
  RepartoSchoolsView
} from "../../../src/runtime/react/default-ui/index.js";
import { RepartoErrorBoundary } from "../../../src/runtime/react/RepartoErrorBoundary.js";
import type { RepartoRole } from "../../../src/runtime/authAdapter.js";
import { setStubRole } from "./service-stub.js";

const CONFIG = { apiBase: "/reparto-api", apiPrefix: "" } as const;

type PanelId = "schools" | "years" | "departments" | "processes" | "boundary";

const PANELS: { id: PanelId; label: string; description: string }[] = [
  {
    id: "schools",
    label: "Schools",
    description: "The island `schools.astro` mounts. School setup is ADMIN and above, so the role switch changes what this shows."
  },
  {
    id: "years",
    label: "Academic years",
    description: "The island `academic-years.astro` mounts over the stubbed year list."
  },
  {
    id: "departments",
    label: "Departments",
    description: "The island `departments.astro` mounts over the stubbed department list."
  },
  {
    id: "processes",
    label: "Processes",
    description: "The island `processes.astro` mounts. With no process selected this is the picker and setup checklist."
  },
  {
    id: "boundary",
    label: "Error boundary",
    description:
      "Every reparto route mounts with `client:only`, so a render throw leaves the page permanently empty rather than merely broken. `A-C3`'s boundary degrades it to the plugin's error surface."
  }
];

const ROLES: RepartoRole[] = ["user", "reader", "writer", "admin", "superadmin"];

/** Throws on demand so the boundary panel has something real to catch. */
function BoundaryProbe({ failing }: { failing: boolean }) {
  if (failing) throw new Error("The preview probe threw during render.");
  return <p className="preview-copy">The probe is rendering normally. Break it to see the catch.</p>;
}

function BoundaryPanel() {
  const [failing, setFailing] = useState(false);
  const [caught, setCaught] = useState<string | null>(null);

  return (
    <div className="preview-stack">
      <div className="preview-actions">
        <button type="button" onClick={() => setFailing((current) => !current)}>
          {failing ? "Repair the probe" : "Break the probe"}
        </button>
        {caught ? <span className="preview-note">onError saw: {caught}</span> : null}
      </div>
      <RepartoErrorBoundary resetKeys={[failing]} onError={(error) => setCaught(error.message)}>
        <BoundaryProbe failing={failing} />
      </RepartoErrorBoundary>
    </div>
  );
}

export function PreviewApp() {
  const [panel, setPanel] = useState<PanelId>("schools");
  const [role, setRole] = useState<RepartoRole>("admin");
  const active = PANELS.find((entry) => entry.id === panel) ?? PANELS[0];

  const chooseRole = (next: RepartoRole) => {
    setStubRole(next);
    setRole(next);
  };

  return (
    <main className="preview-shell">
      <header className="preview-hero">
        <p className="preview-kicker">dev-only fixture</p>
        <h1>astro-reparto-m8 /_preview</h1>
        <p className="preview-copy">
          Every panel below mounts a real island root against an in-memory stand-in for
          reparto-docente-m8. No backend and no mocked hooks: the views, hooks, api wrappers and Zod
          schemas are the shipped ones. Only <code>fetch</code> and the auth adapter are replaced —
          the adapter because every view sits behind a role guard, and a gallery that could not
          name a role would show nothing but the no-access surface.
        </p>
        <nav className="preview-tabs">
          {PANELS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === panel ? "is-active" : undefined}
              onClick={() => setPanel(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>
        <div className="preview-actions">
          <span className="preview-note">Role:</span>
          {ROLES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={candidate === role ? "is-active" : undefined}
              onClick={() => chooseRole(candidate)}
            >
              {candidate}
            </button>
          ))}
        </div>
      </header>

      <section className="preview-card">
        <div className="preview-card__header">
          <h2>{active.label}</h2>
          <p>{active.description}</p>
        </div>
        {/*
          Keyed on the panel *and* the role, so switching either remounts the
          island rather than re-using a mounted one. That is what a route change
          or a different session does, and it is the state a gallery should show.
        */}
        <div className="preview-stage" key={`${panel}:${role}`}>
          {panel === "schools" ? <RepartoSchoolsView config={CONFIG} /> : null}
          {panel === "years" ? <RepartoAcademicYearsView config={CONFIG} /> : null}
          {panel === "departments" ? <RepartoDepartmentsView config={CONFIG} /> : null}
          {panel === "processes" ? <RepartoProcessesView config={CONFIG} /> : null}
          {panel === "boundary" ? <BoundaryPanel /> : null}
        </div>
      </section>
    </main>
  );
}
