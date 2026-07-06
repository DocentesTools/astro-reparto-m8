# astro-reparto-m8

## Authority

Read the workspace root `AGENTS.md` first. This repo follows the workspace
TypeScript/client policy; use workspace `.Codex/` plus this repo's `AGENTS.md`.

## Role

Astro reparto plugin for M8 Astro apps. It depends on the auth plugin contract
because `reparto-docente-m8` accepts `fa-auth-m8` tokens.

Owns the reparto frontend contract: schemas, API wrappers, auth adapter,
route helpers, compatibility checks, neutral starter routes, and integration
configuration. Consumers own secrets, env, i18n labels, and final composition.

## Boundaries

- Require `@mano8/astro-auth-m8` as the auth peer for official M8 usage.
- Couple to auth through `RepartoAuthAdapter` only.
- Talk to `reparto-docente-m8` over HTTP only; never import service code.
- Model public backend responses only; never expose secret/session fields.
- Export public modules through explicit `package.json` subpaths.
- React UI must use pure shadcn/Tailwind composition.
- Table/list views must use the canonical `@mano8/astro-ui-m8` data-table
  pattern, not one-off tables.
- Charts and dashboard visuals should use shadcn chart patterns.

## Commands

- `npm run build`
- `npm run typecheck`
- `npm test`
- `npm run test:unit`
