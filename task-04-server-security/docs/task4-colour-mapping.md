# Task 4 — Email Colour Mapping

Recorded before any inline CSS was written in `src/mailer.js`.

## Source

Task 1 documentation files read:
- `task-01-design-system/docs/colour-roles.md` (sections 5 and 6)
- `task-01-design-system/styles/tokens.css` (section 3: Light Theme roles)

All hex values come directly from the Task 1 `colour-roles.md` section 5 table
(light-mode column) and are cross-checked against `tokens.css` primitives.
No value was invented or estimated.

## Email context

Email clients render in an unknown environment. Dark-mode support in email HTML
is inconsistent and unreliable. This email uses **light-mode roles only**,
applied as inline hex values. CSS variables cannot be used in email HTML because
email clients do not evaluate them.

## Role-to-hex mapping (light mode)

| Email element | Task 1 role | CSS variable (web) | Resolved hex | Contrast verified in Task 1 |
|---|---|---|---|---|
| Page / outer background | `surface` | `--kw-color-surface` → `--kw-palette-neutral-98` | `#F8FAF7` | n/a (outer wrapper) |
| Card background | `surface-container` | `--kw-color-surface-container` → `--kw-palette-neutral-95` | `#EFF1EE` | on-surface on surface-container 15.11:1 Pass |
| Body text | `on-surface` | `--kw-color-on-surface` → `--kw-palette-neutral-10` | `#191C1B` | 15.11:1 on surface-container Pass |
| Supporting / secondary text | `on-surface-variant` | `--kw-color-on-surface-variant` → `--kw-palette-neutral-variant-30` | `#3F4947` | 8.20:1 on surface-container Pass |
| Header band fill | `primary` | `--kw-color-primary` → `--kw-palette-primary-40` | `#006B5E` | — |
| Header text on primary fill | `on-primary` | `--kw-color-on-primary` → `--kw-palette-primary-100` | `#FFFFFF` | 6.43:1 on primary Pass |
| Code block background | `primary-container` | `--kw-color-primary-container` → `--kw-palette-primary-90` | `#9FF2E1` | — |
| Code text on code block | `on-primary-container` | `--kw-color-on-primary-container` → `--kw-palette-primary-10` | `#00201B` | 13.30:1 on primary-container Pass |
| Divider border | `outline-variant` | `--kw-color-outline-variant` → `--kw-palette-neutral-variant-80` | `#BEC9C6` | decorative only (Task 1 §7: must not carry needed information) |

## Roles deliberately not used

| Role | Reason |
|---|---|
| `warning` / `warning-container` | No actionable warning state in this email; expiry note uses supporting text colour only |
| `error` / `error-container` | No error condition in a successful send |
| `outline` (`#6F7977`) | Outline-variant is sufficient for a purely decorative border line in this layout |
| All dark-mode roles | Email dark-mode support is unreliable; light-mode only for consistency |

## Font

Source Sans Pro is specified as the first value in a `font-family` stack with
`sans-serif` as fallback. No `@font-face`, no Google Fonts URL, no linked
stylesheet. Email clients that support web-safe font stacks will use the system
sans-serif when Source Sans Pro is not installed.

