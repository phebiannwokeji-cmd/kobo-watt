# Kobo Watt — Shadow system

Task 1, section 4 (pages 6–7): three shadows built from the primary colour, with x offset, y offset, blur, spread and opacity recorded, plus a two-sentence explanation.

## Shadow values

All three shadows use primary colour #006B5E. Distances are in pixels. X moves the shadow sideways; Y moves it down. Blur softens its edge, spread grows or shrinks it, and opacity controls its strength.

| Shadow | Colour | X offset (px) | Y offset (px) | Blur (px) | Spread (px) | Opacity |
|---|---|---:|---:|---:|---:|---:|
| Soft | #006B5E | 4 | 6 | 12 | 0 | 12% |
| Medium | #006B5E | 4 | 16 | 24 | 0 | 18% |
| Hard | #006B5E | 4 | 20 | 20 | 0 | 20% |

These are my current settings, not prescribed Material defaults. Hard names the strongest of these three treatments; it still has a blurred edge.

## Why use the brand colour?

A shadow made from Kobo Watt’s primary colour adds a teal tint around the card, connecting the shadow to the brand colour. A black shadow would darken the background without that teal tint, giving a more neutral appearance.

## Export evidence

I saved three effect styles. My complete export contains them under `effect/shadow/soft`, `effect/shadow/medium` and `effect/shadow/hard`, with the offsets, blur and spread shown above.

All three exported colours use #006B5E. Their exported alpha bytes are 1f, 2e and 33, approximately 12.16%, 18.04% and 20%; these are the rounded eight-digit HEX representations of my 12%, 18% and 20% Figma settings.

Source: [complete token export](../evidence/06-tokens-complete.json).
