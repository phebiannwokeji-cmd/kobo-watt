# Kobo Watt — Deliberate typography changes

Task 1, page 6, step 3 requires at least two deliberate departures from a documented Material baseline, each with the default, chosen value, reason and a situation where the choice would be worse.

Baseline checked 28 October 2026: Google Material Web's Google Material 3 v0.192 tokens. This names the particular baseline used; it is not a claim that all Material products must use the same font.

## 1. Font family

Default: Roboto for both brand and plain typeface tokens.
Chosen: Source Sans Pro across all fifteen recorded styles.

I chose Source Sans Pro to give Kobo Watt a straightforward, practical appearance. I want payment amounts, account details, and instructions to stand out without decorative lettering competing for attention. I am keeping it because, in my current examples, its appearance supports that direction.

The trade-off is that it may look too ordinary for a product that needs a strongly decorative or luxurious identity. Its suitability for longer instructions and small phone screens still needs to be checked.

This is my stated intention and judgement, not evidence that Source Sans Pro outperforms Roboto in a controlled comparison.


## 2. Display Large letter spacing

Default in the chosen baseline: -0.015625rem, equivalent to -0.25 px at a root font size of 16 px. The baseline Display Large font size is 3.5625rem, or 57 px at that root size.
Chosen: -3.5% of my 64 px font size, equivalent to -2.24 px.

Important: evidence/03-spacing-default.png compares 0% added tracking with the chosen -3.5%. It is a controlled no-added-spacing comparison, not a screenshot of Material's complete baseline typography.

Observed comparison: My Figma text-layer widths are 662 px at 0% and 608 px with the chosen Display Large style. This establishes a narrower appearance, not improved reading speed.

I prefer the tighter version because it makes the large heading look more compact and keeps the words together as one clear message. In my comparison, it takes less horizontal space without reducing the font size. This suits the straightforward appearance I want for Kobo Watt.

The trade-off is that tight spacing may make letters harder to distinguish in smaller text or longer passages. I would not automatically use this −3.5% setting for body text.
## Sources

- [Material v0.192 typefaces](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-ref-typeface.scss)
- [Material v0.192 type scale](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-sys-typescale.scss)
