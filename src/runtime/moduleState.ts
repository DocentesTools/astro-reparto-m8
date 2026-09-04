/**
 * One home for the package's mutable runtime state, shared by every copy of a
 * module rather than owned by one of them.
 *
 * Each value stored here is *registered* by one module and *read back* by
 * another: the fa-auth bridge (or a host) registers the auth adapter and the
 * runtime config; the HTTP client, the hooks and the views read them. A plain
 * module-level `let` makes that handoff depend on both sides resolving to the
 * same module instance — and under `astro dev` they do not.
 *
 * Astro serves a `client:only` island from the package's raw path
 * (`/node_modules/@mano8/astro-reparto-m8/dist/src/runtime/...`), while a bare
 * specifier — the integration's injected bridge script, or a host component
 * importing `@mano8/astro-reparto-m8/react` — is served from Vite's optimized
 * dependency cache (`/.astro/vite/deps/...`). Both graphs are correct, both
 * load `authAdapter.js`, and they load *different copies of it*, each with its
 * own `let`. So the bridge registers the signed-in session on one copy and the
 * island reads the other, which is still the anonymous in-memory adapter: an
 * administrator is refused client-side, before a single request is made, and
 * the route paints its read-only notice. A production build resolves the
 * package once and the split disappears, which is why this only ever showed up
 * in local development.
 *
 * A `Symbol.for` slot on `globalThis` is keyed by the realm, not by the module
 * graph, so every copy reads and writes the same storage and "who is signed in"
 * and "where is the API" are answered once per page however many times these
 * modules are loaded. This registry is the only global the package owns, and it
 * holds nothing a caller has not already handed the package.
 */
const REGISTRY = Symbol.for("@mano8/astro-reparto-m8/runtime-state");

type StateRegistry = Map<string, unknown>;

function registry(): StateRegistry {
  const host = globalThis as typeof globalThis & { [REGISTRY]?: StateRegistry };
  host[REGISTRY] ??= new Map<string, unknown>();
  return host[REGISTRY];
}

export type SharedState<T> = {
  /** The current value, created on first read if nothing is registered yet. */
  get: () => T;
  /** Register `value` for every copy of the module that shares this key. */
  set: (value: T) => void;
};

/**
 * Claim the slot named `key`, initialised lazily by `createInitial`.
 *
 * `key` names one piece of state across the whole package, so it must be
 * unique within it; the symbol above keeps the namespace to this package.
 * `createInitial` runs at most once per realm — the first copy of the module to
 * read the slot fills it, and every later copy sees that same value.
 */
export function sharedState<T>(key: string, createInitial: () => T): SharedState<T> {
  return {
    get: () => {
      const slots = registry();
      if (!slots.has(key)) slots.set(key, createInitial());
      return slots.get(key) as T;
    },
    set: (value: T) => {
      registry().set(key, value);
    }
  };
}
