# Kobo Watt: Colour System and Contrast Record

Figma file: [KOBO WATT](https://www.figma.com/design/UknnGFz1lPOLLDRu2GCrGP/KOBO-WATT?node-id=11-2)

I recorded 112 palette entries and eight key colours. My complete export contains 120 primitives and 100 colour roles; all 100 exported role references resolve to existing tokens. These checks do not establish whole-screen accessibility.

Original workflow: ChatGPT supplied the palettes after I requested Material Design 3 guidance and explicitly required primary40 = #006B5E. I entered the values into Figma by hand. This was manual entry, not manual calculation.

Independent verification: Google Material Color Utilities **0.3.0**, using `TonalPalette.fromInt` for each of the eight source colours. All role-to-HEX references in section 5 match this run. This does not establish which tool or version produced the original ChatGPT response. I do not claim that version 0.4.0 produced my original palette.

Contrast checker: `tools/colour-contrast-check.py`; report: `evidence/02b-contrast-script-output.txt`. These are fresh calculations from this document, not a claim that the Figma screens have been tested.

## 1. Brand colour and where it came from

**Colour:** deep teal, #006B5E.

**Source:** I chose #006B5E from colour suggestions supplied by ChatGPT for Kobo Watt. I compared deep teal with a restrained blue, but did not record the alternative blue HEX. ChatGPT suggested options; I made the final choice.

**Why it fits the brief:** Kobo Watt should feel calm, dependable and connected to energy. Dark teal gives the payment action clear emphasis on a light background. This is my design intention. It has not been tested with users.

**Weakness:** teal can look like the green success colour. I separate a payment action from a confirmed result with labels, icons and position. A payment button says what can be done. A success message says what has already happened.

## 2. Pinning primary 40, before and after

HCT means hue (colour family), chroma (colour strength), and tone (lightness). The measured source values are hue 182.7807, chroma 36.0627, tone 40.1201. A role called primary40 does not mean the stored RGB colour has a measured tone of exactly 40.0000.

There was no saved unforced original: my first ChatGPT prompt already required primary40 to match the brand. I describe any recreated comparison as a **reconstructed comparison**, not an original before-state.

The submitted screenshots are `evidence/01-palette-before-pin.png` and `evidence/02-palette-after-pin.png`.

My reconstructed baseline already gives Primary40 the exact brand colour #006B5E. Requiring Primary40 to keep that value therefore makes no visible colour change: all 14 displayed values remain the same. The screenshots differ in their labels and presentation, but those differences are not palette changes. This is a reconstructed comparison, because my original prompt already required the brand colour at tone 40.

Two different comparisons must not be mixed:

1. **Change primary40 only:** generate `TonalPalette.fromInt(source)`, then set tone 40 to #006B5E. All 14 values remain unchanged. This is the comparison recorded in screenshots 01 and 02.
2. **Compare generation methods:** before = `CorePalette.of(source).a1` in version 0.3.0, whose legacy primary rule uses chroma at least 48; after = `TonalPalette.fromInt(source)`, using the source colour's own hue and chroma. This changes tones 50–90. It is a change of palette recipe, not an effect caused by editing a Figma swatch and not the difference shown in screenshots 01 and 02.

The following table uses comparison 2. It is a reproducible design comparison of generation methods, not a universal default for every Material theme generator or Figma plugin. Its changed tones are not presented as the difference between screenshots 01 and 02. This recipe comparison does not itself demonstrate a before/after change caused by pinning tone 40. Full 14-tone results are saved in `evidence/verified-palettes.json`.

| Tone | Reconstructed CorePalette method | Reconstructed source hue/chroma method |
|---:|---|---|
| 10 | #00201B | #00201B |
| 20 | #003730 | #003730 |
| 30 | #005046 | #005046 |
| 40 | #006B5E | #006B5E |
| 50 | #008676 | #2D8476 |
| 60 | #00A390 | #4B9E90 |
| 70 | #30BFAA | #67BAAA |
| 80 | #56DBC5 | #83D5C5 |
| 90 | #76F8E1 | #9FF2E1 |

Tone 40 is #006B5E in both methods. In the calculated comparison, tones 50–90 change, while the other nine sampled tones stay the same. For example, tone 80 changes from #56DBC5 to #83D5C5, and tone 90 from #76F8E1 to #9FF2E1. I describe the second set as softer and better suited to my intended calm appearance; that is a design judgement. Both methods return the same tone-40 HEX despite different requested chroma. This result alone does not prove the strongest possible chroma at that hue and tone.


## 3. Tonal palettes

Eight families (primary, secondary, tertiary, neutral, neutral variant, error, warning, success), each with 14 tones: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100. That is 112 named tone entries. The video shows 120 entries in the Primitives collection: 112 tones plus eight key colours. It is not 112 different hex values, because black, white and a few others repeat. No extra neutral tones are used.

**Why these 14 tones cover the roles listed here:** each family supplies light and dark choices by assigning different tones to roles. Fourteen is my selected set, not a universal Material requirement. The checks below support the listed pairs; they do not prove every future screen or state is covered. Light buttons use tone 40 with tone 100 text. Dark buttons use tone 80 with tone 20 text. Coloured message boxes use tone 90 with tone 10 text in light mode, and tone 30 with tone 90 text in dark mode. Main text uses neutral 10 on neutral 98 in light mode, and neutral 90 on neutral 10 in dark mode. Supporting text and borders use neutral variant tones.

**My surface choices:** dark surface is neutral 10 (#191C1B) and dark surface-container is neutral 20 (#2E312F). Light surface-container is neutral 95 (#EFF1EE). These are Kobo Watt choices that keep me inside 14 tones. They are not the full Material surface mapping.

## 4. Functional colours

Error, warning and success each have their own palette. Warning and success are custom additions. Design rule: every status must also have an icon and words, so colour is never the only signal. I have not established compliance with this rule across completed screens.

| Meaning | Example in Kobo Watt | Light-mode role and reference | Dark-mode role and reference | Non-colour cue |
|---|---|---|---|---|
| Error | Payment explicitly confirmed failed | error → error40; error-container → error90; on-error-container → error10 | error → error80; error-container → error30; on-error-container → error90 | Error icon and “Payment failed”; show the verified next step |
| Warning | Payment confirmation is delayed | warning → warning40; warning-container → warning90; on-warning-container → warning10 | warning → warning80; warning-container → warning30; on-warning-container → warning90 | Clock icon and “Payment confirmation pending”; explain that reopening checks the existing attempt |
| Success | Confirmed account credit | success → success40; success-container → success90; on-success-container → success10 | success → success80; success-container → success30; on-success-container → success90 | Tick icon, “Payment credited”, confirmed amount and receipt/reference |

A pending payment is not a failed payment. Success means account credit is recorded. It does not mean electricity is confirmed.

## 5. Colour roles

A role is a job, not a colour. Surface is the page background. On-surface is its main text. Surface-container is the card background. On-surface-variant is supporting text. Outline is a border that matters. Outline-variant is a decorative divider. A family name is the strong fill, "on-" is the content on that fill, and "container" is a soft coloured background.

| Role | Light reference | Light HEX | Dark reference | Dark HEX |
|---|---|---|---|---|
| surface | neutral98 | #F8FAF7 | neutral10 | #191C1B |
| on-surface | neutral10 | #191C1B | neutral90 | #E1E3E0 |
| surface-container | neutral95 | #EFF1EE | neutral20 | #2E312F |
| on-surface-variant | neutralVariant30 | #3F4947 | neutralVariant80 | #BEC9C6 |
| outline | neutralVariant50 | #6F7977 | neutralVariant60 | #889390 |
| outline-variant | neutralVariant80 | #BEC9C6 | neutralVariant30 | #3F4947 |
| primary | primary40 | #006B5E | primary80 | #83D5C5 |
| on-primary | primary100 | #FFFFFF | primary20 | #003730 |
| primary-container | primary90 | #9FF2E1 | primary30 | #005046 |
| on-primary-container | primary10 | #00201B | primary90 | #9FF2E1 |
| secondary | secondary40 | #4A635F | secondary80 | #B1CCC7 |
| on-secondary | secondary100 | #FFFFFF | secondary20 | #1C3531 |
| secondary-container | secondary90 | #CDE8E3 | secondary30 | #334B48 |
| on-secondary-container | secondary10 | #061F1D | secondary90 | #CDE8E3 |
| tertiary | tertiary40 | #3F6375 | tertiary80 | #A7CCE1 |
| on-tertiary | tertiary100 | #FFFFFF | tertiary20 | #0A3445 |
| tertiary-container | tertiary90 | #C2E8FD | tertiary30 | #264B5C |
| on-tertiary-container | tertiary10 | #001E2B | tertiary90 | #C2E8FD |
| error | error40 | #BA1A1A | error80 | #FFB4AB |
| on-error | error100 | #FFFFFF | error20 | #690004 |
| error-container | error90 | #FFDAD5 | error30 | #930009 |
| on-error-container | error10 | #410002 | error90 | #FFDAD5 |
| warning | warning40 | #924C00 | warning80 | #FFB780 |
| on-warning | warning100 | #FFFFFF | warning20 | #4E2600 |
| warning-container | warning90 | #FFDCC4 | warning30 | #6F3800 |
| on-warning-container | warning10 | #2F1400 | warning90 | #FFDCC4 |
| success | success40 | #006D3B | success80 | #80D99C |
| on-success | success100 | #FFFFFF | success20 | #00391C |
| success-container | success90 | #9BF6B6 | success30 | #00522B |
| on-success-container | success10 | #00210E | success90 | #9BF6B6 |

The current complete export and generated CSS both use the corrected name `on-primary-container` in the light and dark themes. The earlier `on-primay container` spelling is preserved only in historical prompt records. The exported references still point to Primary10 in light and Primary90 in dark.

## 6. Contrast measurements

Normal text needs 4.5:1. Visual cues needed to identify controls, states or meaningful graphics need 3:1 against relevant adjacent colours, subject to WCAG exceptions. Decorative dividers do not carry this requirement. I use a conservative 4.5:1 minimum for every text pair listed here, including larger text. Ratios are shown to two decimals, and pass or fail is decided from the unrounded value. All pairs are solid colours at full opacity. The checker includes sanity checks: black on white gives 21:1 and a colour on itself gives 1:1. Output: `evidence/02b-contrast-script-output.txt`.

| Mode | Foreground | Background | Use | Ratio | Minimum | Result |
|---|---|---|---|---:|---:|---|
| light | on-surface (neutral10 #191C1B) | surface (neutral98 #F8FAF7) | text | 16.36:1 | 4.5:1 | Pass |
| light | on-surface (neutral10 #191C1B) | surface-container (neutral95 #EFF1EE) | text | 15.11:1 | 4.5:1 | Pass |
| light | on-surface-variant (neutralVariant30 #3F4947) | surface (neutral98 #F8FAF7) | text | 8.87:1 | 4.5:1 | Pass |
| light | on-surface-variant (neutralVariant30 #3F4947) | surface-container (neutral95 #EFF1EE) | text | 8.20:1 | 4.5:1 | Pass |
| light | outline (neutralVariant50 #6F7977) | surface (neutral98 #F8FAF7) | boundary | 4.28:1 | 3.0:1 | Pass |
| light | outline (neutralVariant50 #6F7977) | surface-container (neutral95 #EFF1EE) | boundary | 3.95:1 | 3.0:1 | Pass |
| light | on-primary (primary100 #FFFFFF) | primary (primary40 #006B5E) | text | 6.43:1 | 4.5:1 | Pass |
| light | on-primary-container (primary10 #00201B) | primary-container (primary90 #9FF2E1) | text | 13.30:1 | 4.5:1 | Pass |
| light | primary (primary40 #006B5E) | surface (neutral98 #F8FAF7) | text | 6.13:1 | 4.5:1 | Pass |
| light | on-secondary (secondary100 #FFFFFF) | secondary (secondary40 #4A635F) | text | 6.48:1 | 4.5:1 | Pass |
| light | on-secondary-container (secondary10 #061F1D) | secondary-container (secondary90 #CDE8E3) | text | 13.30:1 | 4.5:1 | Pass |
| light | secondary (secondary40 #4A635F) | surface (neutral98 #F8FAF7) | text | 6.17:1 | 4.5:1 | Pass |
| light | on-tertiary (tertiary100 #FFFFFF) | tertiary (tertiary40 #3F6375) | text | 6.46:1 | 4.5:1 | Pass |
| light | on-tertiary-container (tertiary10 #001E2B) | tertiary-container (tertiary90 #C2E8FD) | text | 13.32:1 | 4.5:1 | Pass |
| light | tertiary (tertiary40 #3F6375) | surface (neutral98 #F8FAF7) | text | 6.15:1 | 4.5:1 | Pass |
| light | on-error (error100 #FFFFFF) | error (error40 #BA1A1A) | text | 6.46:1 | 4.5:1 | Pass |
| light | on-error-container (error10 #410002) | error-container (error90 #FFDAD5) | text | 13.25:1 | 4.5:1 | Pass |
| light | error (error40 #BA1A1A) | surface (neutral98 #F8FAF7) | text | 6.16:1 | 4.5:1 | Pass |
| light | on-warning (warning100 #FFFFFF) | warning (warning40 #924C00) | text | 6.45:1 | 4.5:1 | Pass |
| light | on-warning-container (warning10 #2F1400) | warning-container (warning90 #FFDCC4) | text | 13.34:1 | 4.5:1 | Pass |
| light | warning (warning40 #924C00) | surface (neutral98 #F8FAF7) | text | 6.15:1 | 4.5:1 | Pass |
| light | on-success (success100 #FFFFFF) | success (success40 #006D3B) | text | 6.46:1 | 4.5:1 | Pass |
| light | on-success-container (success10 #00210E) | success-container (success90 #9BF6B6) | text | 13.28:1 | 4.5:1 | Pass |
| light | success (success40 #006D3B) | surface (neutral98 #F8FAF7) | text | 6.16:1 | 4.5:1 | Pass |
| dark | on-surface (neutral90 #E1E3E0) | surface (neutral10 #191C1B) | text | 13.30:1 | 4.5:1 | Pass |
| dark | on-surface (neutral90 #E1E3E0) | surface-container (neutral20 #2E312F) | text | 10.19:1 | 4.5:1 | Pass |
| dark | on-surface-variant (neutralVariant80 #BEC9C6) | surface (neutral10 #191C1B) | text | 10.10:1 | 4.5:1 | Pass |
| dark | on-surface-variant (neutralVariant80 #BEC9C6) | surface-container (neutral20 #2E312F) | text | 7.74:1 | 4.5:1 | Pass |
| dark | outline (neutralVariant60 #889390) | surface (neutral10 #191C1B) | boundary | 5.41:1 | 3.0:1 | Pass |
| dark | outline (neutralVariant60 #889390) | surface-container (neutral20 #2E312F) | boundary | 4.15:1 | 3.0:1 | Pass |
| dark | on-primary (primary20 #003730) | primary (primary80 #83D5C5) | text | 7.73:1 | 4.5:1 | Pass |
| dark | on-primary-container (primary90 #9FF2E1) | primary-container (primary30 #005046) | text | 7.27:1 | 4.5:1 | Pass |
| dark | primary (primary80 #83D5C5) | surface (neutral10 #191C1B) | text | 10.05:1 | 4.5:1 | Pass |
| dark | on-secondary (secondary20 #1C3531) | secondary (secondary80 #B1CCC7) | text | 7.69:1 | 4.5:1 | Pass |
| dark | on-secondary-container (secondary90 #CDE8E3) | secondary-container (secondary30 #334B48) | text | 7.25:1 | 4.5:1 | Pass |
| dark | secondary (secondary80 #B1CCC7) | surface (neutral10 #191C1B) | text | 10.08:1 | 4.5:1 | Pass |
| dark | on-tertiary (tertiary20 #0A3445) | tertiary (tertiary80 #A7CCE1) | text | 7.78:1 | 4.5:1 | Pass |
| dark | on-tertiary-container (tertiary90 #C2E8FD) | tertiary-container (tertiary30 #264B5C) | text | 7.25:1 | 4.5:1 | Pass |
| dark | tertiary (tertiary80 #A7CCE1) | surface (neutral10 #191C1B) | text | 10.11:1 | 4.5:1 | Pass |
| dark | on-error (error20 #690004) | error (error80 #FFB4AB) | text | 7.72:1 | 4.5:1 | Pass |
| dark | on-error-container (error90 #FFDAD5) | error-container (error30 #930009) | text | 7.24:1 | 4.5:1 | Pass |
| dark | error (error80 #FFB4AB) | surface (neutral10 #191C1B) | text | 10.11:1 | 4.5:1 | Pass |
| dark | on-warning (warning20 #4E2600) | warning (warning80 #FFB780) | text | 7.70:1 | 4.5:1 | Pass |
| dark | on-warning-container (warning90 #FFDCC4) | warning-container (warning30 #6F3800) | text | 7.27:1 | 4.5:1 | Pass |
| dark | warning (warning80 #FFB780) | surface (neutral10 #191C1B) | text | 10.09:1 | 4.5:1 | Pass |
| dark | on-success (success20 #00391C) | success (success80 #80D99C) | text | 7.69:1 | 4.5:1 | Pass |
| dark | on-success-container (success90 #9BF6B6) | success-container (success30 #00522B) | text | 7.25:1 | 4.5:1 | Pass |
| dark | success (success80 #80D99C) | surface (neutral10 #191C1B) | text | 10.07:1 | 4.5:1 | Pass |
| light | primary (primary40 #006B5E) | surface-container (neutral95 #EFF1EE) | text | 5.66:1 | 4.5:1 | Pass |
| light | error (error40 #BA1A1A) | surface-container (neutral95 #EFF1EE) | text | 5.69:1 | 4.5:1 | Pass |
| light | warning (warning40 #924C00) | surface-container (neutral95 #EFF1EE) | text | 5.68:1 | 4.5:1 | Pass |
| light | success (success40 #006D3B) | surface-container (neutral95 #EFF1EE) | text | 5.69:1 | 4.5:1 | Pass |
| dark | primary (primary80 #83D5C5) | surface-container (neutral20 #2E312F) | text | 7.70:1 | 4.5:1 | Pass |
| dark | error (error80 #FFB4AB) | surface-container (neutral20 #2E312F) | text | 7.75:1 | 4.5:1 | Pass |
| dark | warning (warning80 #FFB780) | surface-container (neutral20 #2E312F) | text | 7.73:1 | 4.5:1 | Pass |
| dark | success (success80 #80D99C) | surface-container (neutral20 #2E312F) | text | 7.72:1 | 4.5:1 | Pass |

**56 of 56 listed pairs pass their stated thresholds on recalculation.** The last eight cover primary/error/warning/success text on cards. This is a whitelist of checked uses, not proof of whole-screen accessibility. Secondary and tertiary text on cards, focus rings, additional state colours, and any transparency need checks if used. A calculation report records the input colours, formula, result and pass rule so another person can repeat the check.

## 7. Combinations I must not use

These are measured restrictions. They are not faults I found in screens.

| Combination | Foreground / background | Ratio | Minimum | Use instead | New ratio |
|---|---|---:|---:|---|---:|
| White text on dark primary | #FFFFFF / #83D5C5 | 1.71:1 | 4.5:1 | on-primary #003730 | 7.73:1 |
| Warning key colour as light-mode text | #B25E00 / #F8FAF7 | 4.45:1 | 4.5:1 | warning40 #924C00 | 6.15:1 |
| Light outline-variant as a needed border | #BEC9C6 / #F8FAF7 | 1.62:1 | 3:1 | outline #6F7977 | 4.28:1 |
| Dark outline-variant as a needed border | #3F4947 / #191C1B | 1.84:1 | 3:1 | outline #889390 | 5.41:1 |

Outline-variant is for decorative dividers only. It must never carry needed information.

## 8. Rule: never colour alone

The primary, error, warning and success tone-40 colours have similar lightness, but are not exactly identical in measured lightness or contrast. A near-1:1 lightness comparison does not predict exactly what every person with a colour-vision difference sees. Keep words and distinct icons with every status; do not rely on colour alone to tell success from failure.

## 9. Palette evidence

The supplied `primitive palette record.mp4` shows the primitive variable list. No tone or HEX correction was needed. The eight key colours match too. This confirms the recorded state, not any later edits to the file.

- Saved source: `evidence/primitive-palette-record.mp4`.
- Every tone comparison: `evidence/palette-video-comparison.csv` (112 rows).
- Source identity and review limits: `evidence/palette-video-audit.txt`.
- Readable extracted frames: `evidence/palette-video-frames/`.

Warning Key Color = #B25E00 and Warning40 = #924C00 are intentionally different. A starting colour need not itself be tone 40. Do not change Warning40 to the key colour: the latter fails the listed normal-text-on-light-surface check.

## References

- [Material Color Utilities, tonal palette code](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/palettes/tonal_palette.ts)
- [Android: Material colour explained](https://developer.android.com/design/ui/mobile/guides/styles/color)
- [WCAG 2.2: contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2: non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
