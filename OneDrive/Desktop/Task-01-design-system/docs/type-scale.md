# Kobo Watt — Typography record

Recorded from my Figma style-setting screenshots on 28 October 2026. Task 1, page 6, step 3 requires fifteen styles, every value, a line-height explanation, a Display Large spacing comparison and two reasoned departures from documented defaults.

I recorded all fifteen styles and checked that each line height is 1.5 times its font size. My complete JSON export contains the fifteen styles, and my spacing comparison images show 0% and −3.5% letter spacing. These records do not establish readability for every screen.

## Recorded styles

Font family for every row: Source Sans Pro. Weight for every row: SemiBold. These are the names displayed in Figma. Letter spacing is recorded as a percentage, not pixels. Negative values bring letters closer together.

| Style | Font family | Weight | Size (px) | Letter spacing | Line height (px) | Multiplier |
|---|---|---|---:|---:|---:|---:|
| Display Large | Source Sans Pro | SemiBold | 64 | -3.5% | 96 | 1.5 |
| Display Medium | Source Sans Pro | SemiBold | 50 | -3% | 75 | 1.5 |
| Display Small | Source Sans Pro | SemiBold | 40 | -2% | 60 | 1.5 |
| Headline Large | Source Sans Pro | SemiBold | 40 | -1.5% | 60 | 1.5 |
| Headline Medium | Source Sans Pro | SemiBold | 32 | -1.8% | 48 | 1.5 |
| Headline Small | Source Sans Pro | SemiBold | 24 | -1.4% | 36 | 1.5 |
| Title Large | Source Sans Pro | SemiBold | 24 | -1% | 36 | 1.5 |
| Title Medium | Source Sans Pro | SemiBold | 16 | -1% | 24 | 1.5 |
| Title Small | Source Sans Pro | SemiBold | 14 | -0.9% | 21 | 1.5 |
| Body Large | Source Sans Pro | SemiBold | 16 | -0.9% | 24 | 1.5 |
| Body Medium | Source Sans Pro | SemiBold | 14 | -0.7% | 21 | 1.5 |
| Body Small | Source Sans Pro | SemiBold | 12 | -0.4% | 18 | 1.5 |
| Label Large | Source Sans Pro | SemiBold | 14 | -0.9% | 21 | 1.5 |
| Label Medium | Source Sans Pro | SemiBold | 12 | -0.9% | 18 | 1.5 |
| Label Small | Source Sans Pro | SemiBold | 11 | -0.7% | 16.5 | 1.5 |

## Font choice and trade-off

I chose Source Sans Pro to give Kobo Watt a straightforward, practical appearance. I want payment amounts, account details, and instructions to stand out without decorative lettering competing for attention. I am keeping it because, in my current examples, its appearance supports that direction.

The trade-off is that it may look too ordinary for a product that needs a strongly decorative or luxurious identity. Its suitability for longer instructions and small phone screens still needs to be checked.

## Line height

All fifteen styles use font size multiplied by 1.5, one of the multipliers allowed by this assessment. Examples: 64 x 1.5 = 96; 32 x 1.5 = 48; 11 x 1.5 = 16.5. The Label Small setting is 16.5 px; do not substitute the rounded 17 displayed on its canvas selection box.

My reason:

I chose a line height of 1.5 times the font size to give lines space and reduce a cramped appearance. My intention is to help readers move from one line to the next without losing their place. I currently apply this ratio to all fifteen styles. This is a design choice, not proof that 1.5 is best for every person or every role. The supplied single-line examples do not establish the benefit for paragraphs or wrapping headings.

## Display Large: letter-spacing comparison

I compared the same words using Source Sans Pro SemiBold at 64 px, with a line height of 96 px. At 0% letter spacing, the letters have more room and the text measures 662 px wide. At my chosen -3.5% spacing, the letters sit closer together and the text measures 608 px wide. The tighter version looks more compact while keeping the same font size. This comparison shows a visible difference, but it does not prove that the tighter version is easier for everyone to read.

Here, default spacing means 0% added letter spacing for this comparison, not a claimed Material Display Large default. Both supplied comparison screenshots use 76% zoom. The widths above are the text-layer widths displayed by Figma, not screenshot-pixel measurements.

Evidence:
- [Default spacing](../evidence/03-spacing-default.png)
- [Chosen spacing](../evidence/04-spacing-chosen.png)

My default image shows 0% spacing and a 662 px text width; my chosen image shows −3.5% and a 608 px width. Both use Source Sans Pro SemiBold at 64 px with a 96 px line height.

## Required divergences

[Deliberate typography changes](divergences.md) records the font-family and Display Large letter-spacing departures, including the documented baseline, chosen values, approved reasons and trade-offs.

### Why I prefer tighter Display Large spacing

I prefer the tighter version because it makes the large heading look more compact and keeps the words together as one clear message. In my comparison, it takes less horizontal space without reducing the font size. This suits the straightforward appearance I want for Kobo Watt.

The trade-off is that tight spacing may make letters harder to distinguish in smaller text or longer passages. I would not automatically use this −3.5% setting for body text.

## Reading limits

I have not tested these styles in long instructions or small phone layouts. All fifteen use SemiBold with negative letter spacing, so I cannot yet claim that body text remains comfortable for sustained reading.

## Screenshot sources

Display Large: Screenshot Display Large.png.
Display Medium: Screenshot Display Medium.png.
Display Small: Screenshot Display Small.png.
Headline, Title, Body and Label: the twelve correspondingly named Large, Medium and Small PNG files in my evidence collection.
