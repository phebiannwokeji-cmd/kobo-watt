# Incomplete export check

Checked 28 October 2026. Source: evidence/05-tokens-incomplete.json, preserved without edits.

- Valid JSON; root sections: color, font, effect, typography.
- Fifteen named entries in each of font and typography.
- Three shadow effects: soft, medium, hard. All use RGB #006B5E; geometry matches shadows.md.
- Alpha bytes are 1f, 2e and 33 (approximately 12.16%, 18.04% and 20%). These are the export format’s rounded representations of the recorded 12%, 18% and 20% settings.
- Color contains material-theme styles only. Primitives and Color Roles variable collections are absent; no variableId or collectionId fields occur.
- Existing colour styles must not be mistaken for the chosen variable system: material-theme/sys/light/on-primary-container is #005046ff, whereas the recorded Light/On-Primary Container variable references Primary10.


## Complete export comparison — 28 October 2026

Source: evidence/06-tokens-complete.json, preserved without edits.

- Added sections: primitives and color roles.
- 120 primitive variables; 100 role variables (50 Light and 50 Dark).
- All 100 role values preserve references to existing exported tokens; no missing targets found. This checks reference integrity, not every role’s design suitability or contrast.
- Existing color, font, effect and typography sections are exactly unchanged from the incomplete export. The fifteen typography styles and three corrected teal shadows remain present.

Required one-line difference:

The incomplete export omitted the Primitives and Color Roles variable collections; I noticed their sections were absent from the JSON, and enabling Figma Variables added 120 primitives and 100 linked colour roles.

Conversion guardrails: use the color roles and primitives variable sections for interface colours, not the separate material-theme colour styles, which contain different values. Preserve role references in CSS rather than replacing them with fixed colours. The Light/Dark Shadow colour roles reference black palette entries; they are distinct from the three verified teal effect styles. Use those effect styles for the required brand shadows.

