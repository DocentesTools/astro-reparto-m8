import { en } from "./en.js";
import { fr } from "./fr.js";
import { es } from "./es.js";
import type { RepartoDictionary, RepartoLocale } from "./types.js";

export type { RepartoDictionary, RepartoLocale, RepartoDictionaryKey, RepartoStatusLabelKey } from "./types.js";

const DICTIONARIES: Record<RepartoLocale, RepartoDictionary> = {
  en,
  fr,
  es
};

export const REPARTO_LOCALES: readonly RepartoLocale[] = ["en", "fr", "es"];

export function getRepartoDictionary(locale: RepartoLocale): RepartoDictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

export function normalizeRepartoLocale(locale?: string): RepartoLocale {
  const lower = (locale ?? "").trim().toLowerCase();
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("es")) return "es";
  return "en";
}

export type RepartoMessageVars = Record<string, string | number>;

export function formatRepartoMessage(
  template: string,
  vars?: RepartoMessageVars
): string {
  if (!vars) return template;
  return Object.entries(vars).reduce((acc, [key, value]) => {
    const token = `{${key}}`;
    return acc.split(token).join(String(value));
  }, template);
}
