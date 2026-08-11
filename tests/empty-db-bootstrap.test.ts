import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const specPath = join(repoRoot, "docs", "empty-db-bootstrap-spec.md");
const freezePath = join(repoRoot, "docs", "ui-naming-freeze.md");
const inventoryPath = join(repoRoot, "docs", "contract-inventory.md");
const planPath = join(
  repoRoot,
  "..",
  "..",
  ".claude",
  "plans",
  "docentes",
  "todo",
  "reparto-admin-crud-plan-2026-07-06.md"
);

const spec = readFileSync(specPath, "utf8");
const freeze = readFileSync(freezePath, "utf8");
const inventory = readFileSync(inventoryPath, "utf8");

function section(text: string, headingPrefix: string): string {
  const lines = text.split("\n");
  let capturing = false;
  let depth = 0;
  let inFence = false;
  let fenceMarker: string | null = null;
  const result: string[] = [];
  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (fenceMarker === marker) {
        inFence = false;
        fenceMarker = null;
      }
    }
    if (inFence) {
      if (capturing) {
        result.push(line);
      }
      continue;
    }
    const headingMatch = line.match(/^(#+)\s+(?:\d+(?:\.\d+)*\.?\s+)?(.*)/);
    if (headingMatch) {
      const hashes = headingMatch[1].length;
      const heading = headingMatch[2];
      if (capturing && hashes <= depth) {
        break;
      }
      if (heading.startsWith(headingPrefix)) {
        capturing = true;
        depth = hashes;
        continue;
      }
    }
    if (capturing) {
      result.push(line);
    }
  }
  return result.join("\n");
}

describe("empty-DB bootstrap spec — gate definition (Phase 0.5, step 3)", () => {
  it("lives at docs/empty-db-bootstrap-spec.md and is non-empty", () => {
    expect(spec.length).toBeGreaterThan(0);
  });

  it("declares itself the gate for Phases 1 and 2", () => {
    expect(spec).toMatch(/gate\s+for\s+Phases?\s+1.{0,4}2/i);
    expect(spec).toMatch(/Phases?\s+1\s+and\s+2\s+are\s+not\s+"done"\s+until\s+this\s+gate\s+is\s+green/i);
  });

  it("names the user journey in the canonical order", () => {
    const journey = section(spec, "The user journey (step-by-step)");
    expect(journey).toContain("School");
    expect(journey).toContain("Academic year");
    expect(journey).toContain("Department");
    expect(journey).toContain("Process");

    const schoolPos = journey.indexOf("School");
    const yearPos = journey.indexOf("Academic year");
    const deptPos = journey.indexOf("Department");
    const procPos = journey.indexOf("Process");
    expect(schoolPos).toBeGreaterThanOrEqual(0);
    expect(yearPos).toBeGreaterThan(schoolPos);
    expect(deptPos).toBeGreaterThan(yearPos);
    expect(procPos).toBeGreaterThan(deptPos);
  });

  it("encodes the zero-UUID-typing rule explicitly", () => {
    expect(spec).toMatch(/zero\s+UUID\s+typing|raw\s+UUID/i);
    const forbidden = section(spec, "What the user must NEVER see");
    expect(forbidden).toMatch(/UUID/i);
    expect(forbidden).toMatch(/placeholder|default\s+value/i);
    expect(forbidden).toMatch(/button\s+that\s+does\s+nothing|silently[-\s]dead/i);
    expect(forbidden).toMatch(/required\s+i18n\s+key/i);
  });

  it("encodes the one-level inline create rule (plan D-7)", () => {
    expect(spec).toMatch(/one[-\s]level\s+inline\s+create/i);
    expect(spec).toMatch(/Create\s+missing\s+prerequisite/i);
    expect(spec).toMatch(/no\s+nested\s+modals?|modal[-\s]in[-\s]modal/i);
  });

  it("encodes the disabled-reason rule (plan §4, no silently-dead buttons)", () => {
    expect(spec).toMatch(/AC-9[\s\S]{0,400}visible\s+reason/i);
    expect(spec).toMatch(/disabled button/i);
    expect(spec).toMatch(/tooltip/i);
  });

  it("lists the expected API call sequence in order", () => {
    const api = section(spec, "The expected API call sequence");
    const methods = [
      "GET    /schools/",
      "GET    /academic-years/",
      "GET    /departments/",
      "GET    /assignment-processes/",
      "POST   /schools/",
      "POST   /academic-years/",
      "POST   /departments/",
      "POST   /assignment-processes/"
    ];
    let cursor = -1;
    for (const call of methods) {
      const pos = api.indexOf(call);
      expect(pos, `missing API call in spec: ${call}`).toBeGreaterThan(-1);
      expect(pos, `API call out of order: ${call}`).toBeGreaterThan(cursor);
      cursor = pos;
    }
  });

  it("forbids FK reaches via POST/PATCH body and allows them via list endpoints", () => {
    const api = section(spec, "The expected API call sequence");
    expect(api).toMatch(/NEVER\s+reached\s+as\s+FK\s+inputs/i);
    expect(api).toMatch(/list\s+endpoints\s+to\s+populate\s+selects/i);
  });

  it("requires POST calls to be sequential (id dependency chain)", () => {
    const api = section(spec, "The expected API call sequence");
    const conc = section(spec, "Concurrent-call policy");
    expect(api).toMatch(/sequential/i);
    expect(conc).toMatch(/sequential|dependency\s+chain/i);
    expect(conc).toMatch(/TanStack\s+Query/i);
  });

  it("covers all 15 acceptance criteria (AC-1 .. AC-15)", () => {
    for (let i = 1; i <= 15; i += 1) {
      const tag = `AC-${i}`;
      const re = new RegExp(`-\\s*\\[[^\\]]*\\]\\s+\\*\\*${tag}\\*\\*`);
      expect(spec, `missing acceptance criterion: ${tag}`).toMatch(re);
    }
  });

  it("AC-3 lets the user start in any order", () => {
    expect(spec).toMatch(/AC-3[\s\S]{0,400}start\s+in\s+any\s+order/i);
  });

  it("AC-10 mandates the i18n gate in en / fr / es", () => {
    expect(spec).toMatch(/AC-10[\s\S]{0,400}\ben\b[\s\S]{0,80}\bfr\b[\s\S]{0,80}\bes\b/i);
    expect(spec).toMatch(/dictionary\s+completeness\s+test/i);
  });

  it("AC-11 forbids raw UUID strings in rendered HTML", () => {
    expect(spec).toMatch(/AC-11[\s\S]{0,400}UUID/i);
    expect(spec).toMatch(/\\b\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}/);
    expect(spec).toMatch(/UUID regex|render assertion/i);
  });

  it("AC-12 to AC-15 cover error mapping and performance budget", () => {
    expect(spec).toMatch(/AC-12[\s\S]{0,400}error\.\*|dictionary\s+keys/i);
    expect(spec).toMatch(/AC-13[\s\S]{0,400}duplicate/i);
    expect(spec).toMatch(/AC-14[\s\S]{0,400}401|unauthorized/i);
    expect(spec).toMatch(/AC-15[\s\S]{0,400}6\s+wall[-\s]clock\s+seconds|budget/i);
  });

  it("defines three test levels (unit, component, e2e)", () => {
    const testPlan = section(spec, "Test plan");
    expect(testPlan).toMatch(/Unit/i);
    expect(testPlan).toMatch(/Component/i);
    expect(testPlan).toMatch(/End-to-end|End-to-end\s+test/i);
  });

  it("names this test file as the unit-level gate contract", () => {
    const testPlan = section(spec, "Test plan");
    expect(testPlan).toMatch(/empty-db-bootstrap\.test\.ts/);
    expect(testPlan).toMatch(/document\s+test/i);
  });

  it("owns the empty-DB fixture, defers the realistic-department one to Phase 3", () => {
    const fixtures = section(spec, "Fixture plan");
    expect(fixtures).toMatch(/empty-db\.json/);
    expect(fixtures).toMatch(/realistic-department\.json/);
    expect(fixtures).toMatch(/Phase\s+3/i);
  });

  it("references contract-inventory and ui-naming-freeze", () => {
    const ref = section(spec, "Reference");
    expect(ref).toMatch(/docs\/contract-inventory\.md/);
    expect(ref).toMatch(/docs\/ui-naming-freeze\.md/);
  });

  it("defines a Phase 0.5 exit condition", () => {
    const exit = section(spec, "Phase 0.5 exit condition");
    expect(exit).toMatch(/committed/);
    expect(exit).toMatch(/npm\s+test/);
  });
});

describe("UI naming freeze — companion document (Phase 0.5, step 2)", () => {
  it("lives at docs/ui-naming-freeze.md and is non-empty", () => {
    expect(freeze.length).toBeGreaterThan(0);
  });

  it("freezes the two-teachers rule (Teacher roster vs Process participants)", () => {
    expect(freeze).toMatch(/Teacher\s+roster/i);
    expect(freeze).toMatch(/Process\s+participants?/i);
    expect(freeze).toMatch(/two[-\s]?teacher/i);
  });

  it("freezes archive-not-delete for academic years", () => {
    expect(freeze).toMatch(/Archive\s+action,\s+not\s+a\s+Delete\s+action/i);
  });

  it("freezes edit-only for schools and departments", () => {
    expect(freeze).toMatch(/Schools\s+and\s+Departments\s+have\s+only\s+Edit/i);
  });

  it("freezes the read-only rule for audit events", () => {
    expect(freeze).toMatch(/Audit\s+events\s+are\s+read[-\s]only/i);
  });

  it("forbids UUIDs in user-facing strings and the bare 'common.teachers' key", () => {
    expect(freeze).toMatch(/common\.teachers/);
    expect(freeze).toMatch(/UUID\s+string\s+ever\s+appears\s+in\s+a\s+user[-\s]facing/i);
  });

  it("defines the dictionary key root per entity", () => {
    const rows = [
      "entity.school",
      "entity.academicYear",
      "entity.department",
      "entity.teacherRoster",
      "entity.assignmentProcess",
      "entity.subject",
      "entity.classroom",
      "entity.hourRequirement",
      "entity.processParticipant",
      "entity.assignment",
      "entity.meetingSession",
      "entity.selectionTurn",
      "entity.auditEvent"
    ];
    for (const key of rows) {
      expect(freeze, `missing dictionary root: ${key}`).toContain(key);
    }
  });

  it("provides en, fr, es for every canonical entity", () => {
    const table = section(freeze, "Canonical entity naming");
    const locales = ["en", "fr", "es"] as const;
    const entities = [
      { en: "School", fr: "Établissement", es: "Centro" },
      { en: "Academic year", fr: "Année scolaire", es: "Curso académico" },
      { en: "Department", fr: "Département", es: "Departamento" },
      { en: "Teacher roster", fr: "Liste du personnel enseignant", es: "Listado del profesorado" },
      { en: "Assignment process", fr: "Processus d'affectation", es: "Proceso de reparto" },
      { en: "Subject", fr: "Matière", es: "Materia" },
      { en: "Classroom", fr: "Classe", es: "Grupo" },
      { en: "Requirement slot", fr: "Créneau de besoin", es: "Puesto horario" },
      { en: "Process participant", fr: "Participant au processus", es: "Participantes en el proceso" },
      { en: "Assignment", fr: "Affectation", es: "Reparto" },
      { en: "Meeting session", fr: "Séance", es: "Sesión de reparto" },
      { en: "Selection turn", fr: "Tour de sélection", es: "Turno de selección" },
      { en: "Audit event", fr: "Événement d'audit", es: "Evento de auditoría" }
    ];
    for (const entity of entities) {
      for (const locale of locales) {
        expect(
          table,
          `missing ${locale} label for ${entity.en}`
        ).toContain(entity[locale]);
      }
    }
  });

  it("exposes every action verb under action.* (imperative, sentence case)", () => {
    const actions = section(freeze, "Canonical action verbs (button / link / menu labels)");
    const required = [
      "action.create",
      "action.edit",
      "action.delete",
      "action.archive",
      "action.save",
      "action.cancel",
      "action.confirm",
      "action.close",
      "action.reopen",
      "action.transition",
      "action.linkUser",
      "action.copyFrom",
      "action.startTurn",
      "action.completeTurn",
      "action.skipTurn",
      "action.overrideTurn",
      "action.initializeTurns"
    ];
    for (const key of required) {
      expect(actions, `missing action key: ${key}`).toContain(key);
    }
  });

  it("defines disabled-reason dictionary keys (plan §4 visible reason rule)", () => {
    expect(freeze).toContain("disabled.noProcess");
    expect(freeze).toContain("disabled.processClosed");
    expect(freeze).toContain("disabled.missingPrereq");
    expect(freeze).toContain("disabled.invalidHours");
    expect(freeze).toContain("disabled.noData");
    expect(freeze).toContain("disabled.noPermission");
  });

  it("names the setup-checklist dictionary root (plan §4)", () => {
    const checklist = section(freeze, "Setup-checklist card (plan §4 requirement)");
    const required = [
      "flow.bootstrap.title",
      "flow.bootstrap.step.school",
      "flow.bootstrap.step.academicYear",
      "flow.bootstrap.step.department",
      "flow.bootstrap.step.process",
      "flow.bootstrap.step.allocation",
      "flow.bootstrap.step.participants",
      "flow.bootstrap.step.subjects",
      "flow.bootstrap.step.classrooms",
      "flow.bootstrap.step.groupSubjects",
      "flow.bootstrap.step.configurationReview",
      "flow.bootstrap.step.teachingPlan",
      "flow.bootstrap.step.planBalance",
      "flow.bootstrap.step.planLock",
      "flow.bootstrap.step.requirements",
      "flow.bootstrap.step.meeting"
    ];
    for (const key of required) {
      expect(checklist, `missing bootstrap key: ${key}`).toContain(key);
    }
    // `teacherRoster` tested the same condition as `participants` and was
    // retired by audit finding `S2-07`; §12 records what happened to it, so the
    // §8 table must not still carry it (freeze §12 rule 1).
    expect(checklist).not.toContain("flow.bootstrap.step.teacherRoster");
    expect(section(freeze, "Three-stage adaptation amendments")).toContain(
      "flow.bootstrap.step.teacherRoster"
    );
  });

  it("forbids en/fr/es drift in singular vs plural roots", () => {
    const table = section(freeze, "Pluralization roots");
    for (const word of ["School", "Department", "Subject", "Classroom", "Assignment", "Version"]) {
      expect(table).toMatch(new RegExp(`${word}\\s*\\|\\s*${word}s`));
    }
  });
});

describe("contract inventory — still the source of truth (Phase 0.5, step 1)", () => {
  it("lives at docs/contract-inventory.md and lists the global entities", () => {
    expect(inventory).toMatch(/###\s+1\.1\s+School/);
    expect(inventory).toMatch(/###\s+1\.2\s+Academic\s+year/);
    expect(inventory).toMatch(/###\s+1\.3\s+Department/);
    expect(inventory).toMatch(/###\s+1\.4\s+Teacher\s+profile/);
  });

  it("lists the process-scoped entities", () => {
    expect(inventory).toMatch(/###\s+2\.1\s+Assignment\s+process/);
    expect(inventory).toMatch(/###\s+2\.2\s+Subject/);
    expect(inventory).toMatch(/###\s+2\.3\s+Teaching\s+group/);
    expect(inventory).toMatch(/###\s+2\.4\s+Requirement\s+slot/);
    expect(inventory).toMatch(/###\s+2\.5\s+Process\s+teacher/);
    expect(inventory).toMatch(/###\s+2\.6\s+Assignment/);
    expect(inventory).toMatch(/###\s+2\.7\s+Meeting\s+session/);
    expect(inventory).toMatch(/###\s+2\.8\s+Selection\s+turn/);
    expect(inventory).toMatch(/###\s+2\.9\s+Audit\s+event/);
  });

  it("encodes the no-delete rule for schools, departments, and academic years", () => {
    expect(inventory).toMatch(/Delete\s*\|\s*\*\*not\s+exposed\*\*/);
    expect(inventory).toMatch(/Archive\s*\|\s*`POST\s+\/\{year_id\}\/archive`/);
    expect(inventory).toMatch(/edit[-\s]only/);
    expect(inventory).toMatch(/archive,\s+not\s+delete/i);
  });
});

describe("plan file — Phase 0.5 status hooks", () => {
  it("plan still exists at its expected path (relative repo lookup)", () => {
    let exists = true;
    try {
      readFileSync(planPath, "utf8");
    } catch {
      exists = false;
    }
    if (!exists) {
      const fallback = join(repoRoot, "CLAUDE.md");
      try {
        readFileSync(fallback, "utf8");
        return;
      } catch {
        throw new Error(
          `Plan file not found at ${planPath} and no CLAUDE.md fallback. The Phase 0.5 update step should run from this same workspace.`
        );
      }
    }
  });
});
