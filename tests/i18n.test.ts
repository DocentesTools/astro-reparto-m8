import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  REPARTO_LOCALES,
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale
} from "../src/runtime/i18n/index.js";
import { en } from "../src/runtime/i18n/en.js";
import { fr } from "../src/runtime/i18n/fr.js";
import { es } from "../src/runtime/i18n/es.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const freeze = readFileSync(join(repoRoot, "docs", "ui-naming-freeze.md"), "utf8");

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value)) {
      collectStrings(entry, acc);
    }
  }
  return acc;
}

function collectKeys(value: unknown, prefix = ""): string[] {
  const keys: string[] = [];
  if (!value || typeof value !== "object") return keys;
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object") {
      keys.push(...collectKeys(entry, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("reparto i18n dictionary (Phase 1)", () => {
  it("ships exactly the three fleet locales", () => {
    expect(REPARTO_LOCALES).toEqual(["en", "fr", "es"]);
  });

  it("en is the canonical source and fr/es mirror every key", () => {
    const enKeys = collectKeys(en).sort();
    expect(enKeys.length).toBeGreaterThan(0);
    for (const locale of ["fr", "es"] as const) {
      const dict = getRepartoDictionary(locale);
      const localeKeys = collectKeys(dict).sort();
      expect(localeKeys).toEqual(enKeys);
    }
  });

  it("every dictionary string is non-empty", () => {
    for (const locale of REPARTO_LOCALES) {
      const dict = getRepartoDictionary(locale);
      for (const value of collectStrings(dict)) {
        expect(value.trim().length, `${locale} empty string`).toBeGreaterThan(0);
      }
    }
  });

  it("locale field on each dictionary matches its language", () => {
    expect(en.locale).toBe("en");
    expect(fr.locale).toBe("fr");
    expect(es.locale).toBe("es");
  });

  it("normalizes locale input defensively", () => {
    expect(normalizeRepartoLocale(undefined)).toBe("en");
    expect(normalizeRepartoLocale("fr-FR")).toBe("fr");
    expect(normalizeRepartoLocale("es_ES")).toBe("es");
    expect(normalizeRepartoLocale("en-US")).toBe("en");
    expect(normalizeRepartoLocale("")).toBe("en");
  });

  it("getRepartoDictionary falls back to en for unknown locale", () => {
    expect(getRepartoDictionary("xx" as never).locale).toBe("en");
  });

  it("formatRepartoMessage interpolates named vars and ignores missing ones", () => {
    expect(
      formatRepartoMessage("Delete {entity}?", { entity: "School" })
    ).toBe("Delete School?");
    expect(formatRepartoMessage("No vars")).toBe("No vars");
    expect(
      formatRepartoMessage("{a} and {b}", { a: "x", b: 3 })
    ).toBe("x and 3");
  });

  it("forbids the bare 'common.teachers' key (freeze §5.4)", () => {
    for (const locale of REPARTO_LOCALES) {
      const dict = getRepartoDictionary(locale);
      const keys = collectKeys(dict);
      expect(keys, `${locale} must not define common.teachers`).not.toContain(
        "common.teachers"
      );
      expect(
        keys.some((key) => key.endsWith(".teachers") && !key.startsWith("entity."))
      ).toBe(false);
    }
  });

  it("never carries a UUID string in any dictionary value", () => {
    for (const locale of REPARTO_LOCALES) {
      for (const value of collectStrings(getRepartoDictionary(locale))) {
        expect(value, `${locale} leaked a UUID: ${value}`).not.toMatch(UUID_RE);
      }
    }
  });

  it("freezes the two-teachers rule: distinct roots for roster vs participants", () => {
    const enDict = getRepartoDictionary("en");
    expect(enDict.entity.teacherRoster.singular).not.toBe(
      enDict.entity.processParticipant.singular
    );
    expect(freeze).toMatch(/Teacher\s+roster/i);
    expect(freeze).toMatch(/Process\s+participants?/i);
  });

  it("freezes archive-not-delete for academic years", () => {
    expect(en.action.archive).toBe("Archive");
    expect(en.entity.academicYear.status.archived).toBe("Archived");
    expect(freeze).toMatch(/Archive\s+action,\s+not\s+a\s+Delete\s+action/i);
  });

  it("mirrors the canonical entity labels from the freeze (en/fr/es)", () => {
    expect(en.entity.school.singular).toBe("School");
    expect(fr.entity.school.singular).toBe("Établissement");
    expect(es.entity.school.singular).toBe("Centro");
    expect(en.entity.classroom.singular).toBe("Classroom");
    expect(fr.entity.classroom.singular).toBe("Classe");
    expect(es.entity.classroom.singular).toBe("Grupo");
    expect(en.entity.hourRequirement.singular).toBe("Hour requirement");
    expect(es.entity.hourRequirement.singular).toBe("Horas necesarias");
  });

  it("exposes every action verb under action.* from the freeze", () => {
    const required = [
      "create",
      "edit",
      "delete",
      "archive",
      "save",
      "cancel",
      "confirm",
      "close",
      "reopen",
      "transition",
      "linkUser",
      "copyFrom",
      "startTurn",
      "completeTurn",
      "skipTurn",
      "overrideTurn",
      "initializeTurns"
    ] as const;
    for (const key of required) {
      expect(en.action[key], `missing action.${key}`).toBeTruthy();
      expect(fr.action[key], `missing fr action.${key}`).toBeTruthy();
      expect(es.action[key], `missing es action.${key}`).toBeTruthy();
    }
  });

  it("exposes every disabled-reason and error key from the freeze", () => {
    expect(en.disabled.noProcess).toBeTruthy();
    expect(en.disabled.processClosed).toContain("{status}");
    expect(en.disabled.missingPrereq).toContain("{prereq}");
    expect(en.error.duplicate).toBeTruthy();
    expect(en.error.fkViolation).toContain("{count}");
    expect(en.error.hoursExceed).toContain("{assigned}");
    expect(en.error.unauthorized).toBeTruthy();
    expect(en.error.invalidDate).toBeTruthy();
    expect(en.error.conflict).toBeTruthy();
    expect(fr.error.invalidDate).toBeTruthy();
    expect(fr.error.conflict).toBeTruthy();
    expect(es.error.invalidDate).toBeTruthy();
    expect(es.error.conflict).toBeTruthy();
  });

  it("exposes the setup-checklist bootstrap keys", () => {
    expect(en.flow.bootstrap.title).toBeTruthy();
    expect(en.flow.bootstrap.step.school).toBeTruthy();
    expect(en.flow.bootstrap.step.participants).toBeTruthy();
    expect(fr.flow.bootstrap.step.department).toBeTruthy();
    expect(es.flow.bootstrap.step.process).toBeTruthy();
  });

  it("exposes nav group + item keys for both sidebar groups", () => {
    expect(en.nav.group.setup).toBe("Setup");
    expect(en.nav.group.process).toBe("Process");
    expect(en.nav.item.teacherRoster).toBe("Teacher roster");
    expect(en.nav.item.processParticipants).toBe("Process participants");
    expect(en.nav.item.planning).toBe("Planning");
    expect(fr.nav.item.shared).toBe("Écran partagé");
    expect(es.nav.item.audit).toBe("Auditoría");
  });

  it("fully localizes the main-subject materialization workflow", () => {
    expect(collectKeys(fr.planning.materialization).sort()).toEqual(
      collectKeys(en.planning.materialization).sort()
    );
    expect(collectKeys(es.planning.materialization).sort()).toEqual(
      collectKeys(en.planning.materialization).sort()
    );
    expect(fr.planning.materialization.confirmBody).not.toBe(
      en.planning.materialization.confirmBody
    );
    expect(es.planning.materialization.confirmBody).not.toBe(
      en.planning.materialization.confirmBody
    );
    expect(en.planning.materialization.confirmBody).toContain("{missing}");
    expect(en.planning.materialization.confirmBody).toContain(
      "{materialized}"
    );
    expect(collectKeys(fr.planning.secondary).sort()).toEqual(
      collectKeys(en.planning.secondary).sort()
    );
    expect(collectKeys(es.planning.secondary).sort()).toEqual(
      collectKeys(en.planning.secondary).sort()
    );
    expect(fr.planning.secondary.deleteBody).not.toBe(
      en.planning.secondary.deleteBody
    );
    expect(es.planning.secondary.deleteBody).not.toBe(
      en.planning.secondary.deleteBody
    );
    expect(en.planning.secondary.deleteBody).toContain("{subject}");
    expect(collectKeys(fr.planning.generation).sort()).toEqual(
      collectKeys(en.planning.generation).sort()
    );
    expect(collectKeys(es.planning.generation).sort()).toEqual(
      collectKeys(en.planning.generation).sort()
    );
    expect(en.planning.generation.previewSummary).toContain("{generation}");
    expect(fr.planning.generation.lockUnavailable).not.toBe(
      en.planning.generation.lockUnavailable
    );
    expect(es.planning.generation.lockUnavailable).not.toBe(
      en.planning.generation.lockUnavailable
    );
  });

  it("localizes route-loading copy in every supported locale", () => {
    expect(en.view.pageLoading).toEqual({
      title: "Loading reparto page",
      description: "Preparing the latest page content."
    });
    expect(fr.view.pageLoading.title).toBe(
      "Chargement de la page de répartition"
    );
    expect(es.view.pageLoading.title).toBe("Cargando página de reparto");
    expect(fr.view.pageLoading.description).not.toBe(
      en.view.pageLoading.description
    );
    expect(es.view.pageLoading.description).not.toBe(
      en.view.pageLoading.description
    );
  });

  it("fully localizes classroom bulk and stage CRUD surfaces", () => {
    const roots = ["classroomBulk", "classroomStages"] as const;
    for (const root of roots) {
      const english = collectStrings(en[root]);
      expect(collectKeys(fr[root]).sort()).toEqual(collectKeys(en[root]).sort());
      expect(collectKeys(es[root]).sort()).toEqual(collectKeys(en[root]).sort());
      expect(collectStrings(fr[root])).not.toEqual(english);
      expect(collectStrings(es[root])).not.toEqual(english);
    }
    expect(fr.classroomBulk.groupStart).toBe("Premier groupe");
    expect(es.classroomBulk.groupEnd).toBe("Último grupo");
    expect(en.classroomBulk.action).toBe("Create groups");
    expect(es.classroomBulk.action).toBe("Crear grupos");
    expect(fr.classroomBulk.action).toBe("Créer des groupes");
    expect(en.classroomSelection.deleteSelected).toBe("Delete selected ({count})");
    expect(es.classroomSelection.selectAllVisible).toBe("Seleccionar todos los grupos visibles");
    expect(fr.classroomSelection.deleteTitle).toBe("Supprimer les classes sélectionnées");
    expect(fr.classroomStages.toast.deleteError).toContain("supprimer");
    expect(es.classroomStages.deleteBody).toContain("{name}");
  });
});
