# Dates and times

Use `@internationalized/date` for all date/time values. See also [i18n.md](./i18n.md).

## Storage

Never store `Date` or strings in app state.

| Need                        | Type               |
| --------------------------- | ------------------ |
| Calendar day                | `CalendarDate`     |
| Day + wall-clock time       | `CalendarDateTime` |
| Exact instant with timezone | `ZonedDateTime`    |
| Time of day                 | `Time`             |

Store instants as `ZonedDateTime`. Persist/serialize with `.toString()` (ISO 8601) and parse with `parseZonedDateTime`, `parseDate`, etc.

## Formatting

Use `DateFormatter` with the active Paraglide locale.

```ts
import { DateFormatter, now, getLocalTimeZone } from "@internationalized/date";
import { getLocale } from "#/paraglide/runtime";

const formatter = new DateFormatter(getLocale(), { dateStyle: "medium", timeStyle: "short" });
const text = formatter.format(now(getLocalTimeZone()).toDate());
```

Pass the formatted string into a message param: `m.common__last_run__label({ when: text })`.

## Timezones

- Use `getLocalTimeZone()` only at the UI edge. Keep stored values zoned.
- Convert for display with `toZoned(...)` / `toTimeZone(...)`.
- `.toDate()` is only for handing a value to `Intl`/`DateFormatter`; never keep the result.
