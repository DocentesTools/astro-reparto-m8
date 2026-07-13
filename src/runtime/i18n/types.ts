import type { en } from "./en.js";

export type RepartoLocale = "en" | "fr" | "es";

export type RepartoDictionary = typeof en;

export type RepartoDictionaryKey = keyof RepartoDictionary;

export type RepartoStatusLabelKey = keyof RepartoDictionary["entity"]["assignmentProcess"]["status"];
