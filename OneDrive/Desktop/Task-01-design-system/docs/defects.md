# Kobo Watt — Defects

## Deliberate regression: broken colour reference

I replaced the light Primary role’s palette reference with the fixed colour #006B5E, then temporarily changed Primary40 and Primary90 in the CSS palette to purple values. The Active chip followed its Primary Container reference and became pale purple, while the Pay button stayed teal because its Primary role no longer followed the palette. This shows why colour roles should reference the palette: a shared colour change can otherwise leave disconnected parts of the screen behind.

Evidence: [11-broken-referencing.png](../evidence/11-broken-referencing.png)

This experiment changed the CSS palette only; the original Figma file and JSON exports were unchanged.
