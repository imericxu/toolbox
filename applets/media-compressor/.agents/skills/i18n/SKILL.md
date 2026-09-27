---
name: i18n
description: Use when adding, changing, or translating UI strings, editing messages/*.json, using m.*() message functions, or displaying dates/times in the UI.
---

# i18n

Read first: `docs/architecture/i18n.md` (key grammar, scope/role tables, variant syntax) and `docs/architecture/dates.md`.

## Procedure

1. Search `messages/en.json` for an existing key with the same sense. Reuse it.
2. Pick `<scope>__<element>__<role>`. If no scope/role fits, extend `SCOPES`/`ROLES` in `scripts/i18n-check.ts` and the tables in `docs/architecture/i18n.md` in the same change.
3. Use Inlang plural/selector/markup syntax in one key. Never add `__one`/`__other` keys. Prefer closed-set `.match` with explicit cases and no `*` fallback (gives a typed union param).
4. Write the key in `messages/en.json`.
5. Run `bun run i18n:check`, then `bun run i18n:gen`.
6. Dates: store and format with `@internationalized/date`, never `Date` or strings.

## Done when

Both `bun run i18n:check` and `bun run i18n:gen` pass.
