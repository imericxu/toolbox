# Documentation

In-repo reference documentation, meant to be readable and navigable by both
humans and agents.

## Conventions

- Filenames are kebab-case (e.g., `example-file.md`), except this index file.
- Docs are grouped into category subfolders, not left flat in `docs/`.
    - Add a new subfolder only when an existing category doesn't fit.
- Whenever a doc is added, moved, or removed, update the table below in the same
  change and check whether [`README.md`](../README.md) links to it directly.

## Map

This is a flat per-file table, which works while the doc set is small. If it
grows too large to scan at a glance, revisit the approach.

| Doc                                              | Category     | Description |
| ------------------------------------------------ | ------------ | ----------- |
| [`architecture/i18n.md`](./architecture/i18n.md) | Architecture |             |
