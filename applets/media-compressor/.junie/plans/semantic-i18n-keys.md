---
sessionId: session-261017-101121-1t8l
---

# Requirements

### Goal
Replace random human-id keys (e.g. `grumpy_keys_swim`) with strict semantic keys, enforced by a validator, and document the system in `docs/architecture/i18n.md` (currently only a title).

### Key format (strict)
`<scope>__<element>__<role>[__<variant>]`: segments separated by a double underscore; each segment may be multiple words joined by a single `_` (e.g. `home__file_picker__drop_hint`). All lowercase ASCII `[a-z0-9_]`.
- scope: feature/domain (`app`, `common`, `error`).
- element: UI thing (`title`, `button`, `dialog`).
- role/variant: optional qualifier (`label`, `description`, `placeholder`, `aria`, `error`).
- Keys name *purpose*, not text content; never renamed when copy changes.
- 2-4 segments, each 1-4 words (words 1-15 chars); first segment must be an allowed scope (may be multi-word, e.g. `video_settings`).
- No leading/trailing/triple underscores.
- Existing key becomes `app__title`.

### Disambiguation (part of speech / sense)
Keys must carry enough context to resolve ambiguous words (e.g. "Open" as verb vs. adjective, "Close", "Set", "Light").
- The *role* segment encodes the grammatical/functional sense: `action` (verb/imperative on buttons, menu items), `status` (adjective/state), `label` (noun field label), `title`, `description`, `placeholder`, `aria`, `error`, `hint`.
- Same English word in different senses MUST use different keys: `file__open__action` ("Open") vs `door__open__status` ("Open").
- Never reuse a key across senses even if the text is identical today; other languages translate them differently.
- Roles are a closed list; the validator also checks the last segment is an allowed role (const list in `scripts/i18n-check.ts`).
- Do NOT split variants into multiple keys (no `__one`/`__other`, `__singular`/`__plural`, per-state duplicates). Use Inlang message-format inside a single key:
  - Plurals: `.input {$count :number} .match $count one {{...}} * {{...}}`.
  - Selectors: `.match` on a declared input for gender/state/kind.
  - Markup: `{#bold}text{/bold}` / `{#link}...{/link}`; never concatenate fragments.
  - Formatting: `{$size :number}`, `{$date :datetime}`.
- Closed-set selectors: when values are known (status, kind, mode), use `.match` with explicit cases and no `*` fallback so Paraglide generates a strongly-typed union param (e.g. `status: "idle" | "running" | "done"`). Avoid open-set selectors. Different senses (open verb vs adjective) still use separate keys; same-sense variants use selectors.
- Verify exact syntax against the installed plugin version before writing docs.

### Agentic-first l10n management
- Agents (not humans) choose new keys and organization; docs are written as agent instructions: decision procedure for picking scope/element/role, reuse existing keys when sense matches, run `i18n:check`, then `i18n:gen`.
- Scopes and roles are an open registry: if no existing scope fits, the agent MAY add a new one by adding it to the scope const in `scripts/i18n-check.ts` and the docs scope table in the same change (with one-line description). Roles are extended the same way, only when no existing role fits the sense.
- Validator enforces consistency (registry vs. keys), so agent additions are safe.

### Dates & times
- `@internationalized/date` is the primary date/time storage type (`CalendarDate`, `CalendarDateTime`, `ZonedDateTime`, `Time`); never store `Date` or strings in app state.
- Add dependency `@internationalized/date`.
- Formatting: use `DateFormatter` from the package with the active Paraglide locale (`getLocale()`), or pass preformatted strings as message params. Documented in separate `docs/architecture/dates.md`, linked from i18n.md.

### Agent skill
- Add `.agents/skills/i18n/SKILL.md` (frontmatter `name: i18n`, trigger description: adding/changing/translating UI strings, messages/*.json, m.*() usage, dates in UI).
- Skill is a short procedure; details stay in `docs/architecture/i18n.md` and `dates.md` (linked, not duplicated): 1) search existing keys, reuse if same sense; 2) pick scope/element/role (extend registry if none fit); 3) use Inlang plural/selector/markup, closed-set `.match` without `*`; 4) write key in en.json; 5) `bun run i18n:check` then `i18n:gen`; 6) dates via `@internationalized/date`. Completion: both commands pass.
- Follow `writing-for-agents` skill conventions.

### Out of scope
Adding locales; nested JSON keys (Paraglide message-format is flat).

# Technical Design

### Current
- `messages/en.json` flat: `grumpy_keys_swim`: "Media Compressor"; used in `src/routes/index.tsx`.
- `scripts/i18n-key.ts` generates random keys via `human-id`; `package.json` has `i18n:key`, `i18n:gen`.
- `src/paraglide/` is generated output.

### Changes
1. `messages/en.json`: rename `grumpy_keys_swim` -> `app__title`; update usage in `src/routes/index.tsx` (`m.app__title()`); regenerate via `bun run i18n:gen`.
2. Replace `scripts/i18n-key.ts` with `scripts/i18n-check.ts`: reads `messages/*.json`, validates every key against regex `^[a-z0-9]+(_[a-z0-9]+)*(__[a-z0-9]+(_[a-z0-9]+)*){1,3}$` (words joined by `_`, segments by `__`), word length, segment count, allowed scopes (const list in script), and that all locales share the same key set; sorted-keys check; exits non-zero with messages. Optional `--fix` sorts keys.
3. `package.json`: replace `i18n:key` with `i18n:check`; hook into `lint` script (`bun scripts/i18n-check.ts && oxlint ...`). Remove `human-id` dependency if unused elsewhere.
4. Docs `docs/architecture/i18n.md`: Paraglide/inlang overview, file layout, key grammar with table of scopes/elements/roles, good/bad examples, rules (no text-derived keys, no renames on copy change, params as `{name}` camelCase), workflow (add key -> `i18n:check` -> `i18n:gen`), adding a locale.

### Risks
- Scope list needs maintenance: documented as the one place to update (script const + docs table).

# Testing

- `bun run i18n:check` passes on current en.json.
- Temporarily invalid keys (`Foo`, `grumpy_keys_swim`, unknown scope, 5 segments, `a___b`, trailing `_`) fail; `home__file_picker__drop_hint` passes.
- Unknown role (`home__button__foo`) fails; `file__open__action` and `door__open__status` pass.
- Validator rejects keys ending in `__one`/`__other`/`__plural`/`__singular`.
- Docs include a worked plural + closed-set selector example; after `i18n:gen`, generated messages show a union-typed param.
- `bun run i18n:gen` and `bun run lint` succeed.

# Delivery Steps

### ✓ Step 1: Add strict key validator and migrate existing key
Keys are validated by script and en.json uses semantic key.

- Create `scripts/i18n-check.ts` with regex, scope list, length, sorting, locale parity checks.
- Remove `scripts/i18n-key.ts`; update `package.json` scripts (`i18n:check`, lint hook); drop `human-id` if unused.
- Rename `grumpy_keys_swim` to `app__title` in `messages/en.json` and `src/routes/index.tsx`; run `i18n:gen`.

### ✓ Step 2: Write i18n architecture docs
`docs/architecture/i18n.md` fully documents the system.

- Overview of Paraglide/inlang setup and file layout.
- Key grammar, scope and role tables, good/bad examples, rules.
- Disambiguation section: verb vs adjective ("open") examples and role semantics.
- Workflow for adding keys and locales, and how the check script enforces rules.
- Variants section: plurals, selectors, markup, formatting, closed-set selectors for typed params, before/after examples, ban on variant-suffixed keys.
- Validator (step 1) also rejects variant-suffix keys.

### ✓ Step 3: Agentic workflow docs and date handling
Agent-oriented docs and dates doc exist; dependency installed.

- Add agent decision procedure and registry-extension rules to i18n.md.
- Create `.agents/skills/i18n/SKILL.md` pointing to the docs with the step procedure and completion criteria.
- `bun add @internationalized/date`; write `docs/architecture/dates.md` (storage types, DateFormatter with locale, timezone rules, examples).