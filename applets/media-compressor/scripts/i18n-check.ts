import { Glob } from "bun";

/** Registry: add new scopes here AND in docs/architecture/i18n.md in the same change. */
export const SCOPES = ["app", "common", "error"] as const;

/** Registry: last segment of every key must be one of these. Document in docs/architecture/i18n.md. */
export const ROLES = [
  "action",
  "aria",
  "description",
  "error",
  "hint",
  "label",
  "placeholder",
  "status",
  "title",
] as const;

const BANNED_SUFFIXES = ["one", "other", "plural", "singular", "zero", "few", "many", "two"];
const KEY_REGEX = /^[a-z0-9]+(_[a-z0-9]+)*(__[a-z0-9]+(_[a-z0-9]+)*){1,3}$/;
const MAX_WORDS = 4;
const MAX_WORD_LENGTH = 15;

export function validateKey(key: string): string[] {
  const errors: string[] = [];
  if (!KEY_REGEX.test(key)) {
    errors.push(
      "must match <scope>__<element>__<role>[__<variant>] using lowercase [a-z0-9], words joined by '_', segments by '__' (2-4 segments)",
    );
    return errors;
  }
  const segments = key.split("__");
  for (const segment of segments) {
    const words = segment.split("_");
    if (words.length > MAX_WORDS) errors.push(`segment '${segment}' has more than ${MAX_WORDS} words`);
    for (const word of words) {
      if (word.length > MAX_WORD_LENGTH) {
        errors.push(`word '${word}' longer than ${MAX_WORD_LENGTH} chars`);
      }
    }
  }
  const [scope] = segments;
  if (!(SCOPES as readonly string[]).includes(scope)) {
    errors.push(`unknown scope '${scope}' (allowed: ${SCOPES.join(", ")})`);
  }
  const last = segments[segments.length - 1];
  if (BANNED_SUFFIXES.includes(last)) {
    errors.push(`variant suffix '${last}' banned; use Inlang plural/selector syntax in one key`);
  } else if (!(ROLES as readonly string[]).includes(last)) {
    errors.push(`unknown role '${last}' (allowed: ${ROLES.join(", ")})`);
  }
  return errors;
}

if (import.meta.main) {
  const fix = process.argv.includes("--fix");
  const problems: string[] = [];
  const keySets = new Map<string, string[]>();

  for await (const file of new Glob("messages/*.json").scan(".")) {
    const data = (await Bun.file(file).json()) as Record<string, unknown>;
    const keys = Object.keys(data).filter((k) => k !== "$schema");
    keySets.set(file, keys);

    for (const key of keys) {
      for (const err of validateKey(key)) problems.push(`${file}: '${key}': ${err}`);
    }

    const sorted = [...keys].sort();
    if (keys.some((k, i) => k !== sorted[i])) {
      if (fix) {
        const out: Record<string, unknown> = {};
        if ("$schema" in data) out["$schema"] = data["$schema"];
        for (const k of sorted) out[k] = data[k];
        await Bun.write(file, JSON.stringify(out, null, 2) + "\n");
        console.log(`${file}: sorted keys`);
      } else {
        problems.push(`${file}: keys not sorted (run with --fix)`);
      }
    }
  }

  const all = new Set([...keySets.values()].flat());
  for (const [file, keys] of keySets) {
    for (const k of all) {
      if (!keys.includes(k)) problems.push(`${file}: missing key '${k}'`);
    }
  }

  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("i18n keys OK");
}
