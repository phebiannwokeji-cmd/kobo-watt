# Kobo Watt Design System — Token Conversion

This repository contains the design system tokens and conversion pipeline for **Kobo Watt** (Task 1, Step 6).

## Overview

Figma design tokens exported to `evidence/06-tokens-complete.json` are converted into CSS custom properties and reusable typography classes.

### Generated CSS Files
- [`styles/tokens.css`](file:///c:/Users/LENOVO%20PC/OneDrive/Desktop/Task-01-design-system/styles/tokens.css):
  - **120 Primitive Colours** in `:root` (8 key colours and 112 tonal palette steps across 8 tonal families).
  - **3 Shadow Effects** in `:root` (`--kw-shadow-soft`, `--kw-shadow-medium`, `--kw-shadow-hard`) preserving 8-digit HEX colours with alpha transparency.
  - **50 Light Colour Roles** in `:root` referencing primitive custom properties via `var()`.
  - **50 Dark Colour Roles** under `[data-theme="dark"]` referencing their exported dark targets via `var()`.
- [`styles/typography.css`](file:///c:/Users/LENOVO%20PC/OneDrive/Desktop/Task-01-design-system/styles/typography.css):
  - **15 Typography Styles** represented as custom properties (`font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`).
  - **15 Reusable Utility Classes** (`.kw-typography-<style>`, `.<style>`) applying the token definitions.

---

## Command to Regenerate CSS

To regenerate the CSS custom properties from `evidence/06-tokens-complete.json`, run:

```bash
python tools/convert-tokens.py
```

The conversion script is deterministic and idempotent: running it repeatedly on the same input produces identical output.

---

## How to Select the Dark Theme

The design system implements theme switching via the `data-theme` attribute:

- **Light theme (default):** Active by default on `:root`.
- **Dark theme:** Apply `data-theme="dark"` to any container element (typically the `<html>` or `<body>` element):

```html
<!-- Whole page in dark mode -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/typography.css">
</head>
<body>
  ...
</body>
</html>
```

Theme switching can also be scoped to individual subtrees or cards:

```html
<div class="card" data-theme="dark">
  <!-- Elements inside use dark role references -->
</div>
```

---

## Verification Suite

To run all automated checks:

```bash
python tools/verify-tokens.py
```

### Verified Checks:
1. **120 Primitive Colours:** All 8 key colours and 112 tonal palette steps (tones 0–100 across 8 families) are declared in `:root`.
2. **50 Light and 50 Dark Colour Roles:** All 50 light role variables in `:root` and all 50 dark role variables in `[data-theme="dark"]` are present.
3. **Role Reference Resolution:** Every role reference resolves to a valid declared primitive custom property. No missing or circular references.
4. **15 Typography Styles:** All 15 text styles are converted with individual token properties and reusable CSS classes.
5. **3 Shadows:** `soft`, `medium`, and `hard` are converted from `effect/shadow` with offsets, blur, spread, and 8-digit HEX transparency preserved.
6. **Display Large Verification:** Font size = 64px, line height = 96px, weight = 600, letter spacing = -2.24px.
7. **Idempotency:** Re-running `tools/convert-tokens.py` produces identical SHA-256 file hashes.
8. **Source File Immutability:** SHA-256 hashes of `evidence/05-tokens-incomplete.json` and `evidence/06-tokens-complete.json` remain unchanged.

---

## Font Loading Note (Source Sans Pro)

Declaring `font-family: 'Source Sans Pro', sans-serif;` in CSS does **not** load the font into the browser. 

- **Current Status:** The actual Source Sans Pro SemiBold (weight 600) webfont **is bundled** in `fonts/` as two WOFF2 subsets: `SourceSansPro-SemiBold-latin.woff2` and `SourceSansPro-SemiBold-latin-ext.woff2`. The latin-ext subset is required for the Naira sign (U+20A6). `styles/fonts.css` declares `@font-face` for the exact family name `'Source Sans Pro'` at weight 600, and the prototype loads it alongside the generated stylesheets.
- **Chosen Typeface:** **Source Sans Pro SemiBold (weight 600)** across all 15 typography styles. Do not substitute other typefaces (such as Source Sans 3 or Roboto) without documented divergence approval.
- **Loading Options for Implementation:**
  > [!IMPORTANT]
  > Font-loading CSS must be kept separate from generated stylesheets (`styles/tokens.css`, `styles/typography.css`) so that running `python tools/convert-tokens.py` cannot erase it.

  1. **Self-hosted webfonts (used by this prototype):** The bundled files are declared in `styles/fonts.css`, a separate, non-generated stylesheet:
     ```css
     /* styles/fonts.css (separate stylesheet — never overwritten by token generator) */
     @font-face {
       font-family: 'Source Sans Pro';
       src: url('../fonts/SourceSansPro-SemiBold-latin.woff2') format('woff2');
       font-weight: 600;
       font-style: normal;
       font-display: swap;
     }
     ```
     Then include it in the HTML document alongside the generated files:
     ```html
     <link rel="stylesheet" href="styles/fonts.css">
     <link rel="stylesheet" href="styles/tokens.css">
     <link rel="stylesheet" href="styles/typography.css">
     ```
  2. **Google Fonts CDN (alternative):** Include in HTML `<head>` before the generated stylesheets:
     ```html
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@600&display=swap" rel="stylesheet">
     ```
