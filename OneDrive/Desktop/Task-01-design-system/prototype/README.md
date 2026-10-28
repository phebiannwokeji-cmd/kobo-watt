# Kobo Watt — account-summary prototype

This folder is the **account-summary screen** for Task 1, step 7. It is a
plain static prototype, not a production application.

The pre-design-system version was captured as
`evidence/09-screen-without-system.png`. The current screen applies the
generated design system. It loads `styles/tokens.css`,
`styles/typography.css`, the self-hosted Source Sans Pro SemiBold font via
`styles/fonts.css`, and a local layout layer, `screen.css`. The temporary
`baseline.css` has been removed.

## Open it

Serve the **repository root**, because the screen references `../styles/` and
`../fonts/`:

```powershell
python -m http.server 4173
```

Then open <http://localhost:4173/prototype/>.

Routes:

- `/prototype/index.html` — account summary
- `/prototype/help.html` — Get help
- `/prototype/help-no-power.html` — “Access active, but no power” demonstration help page

## Demonstration account state

All values are fictional and must stay fixed for the before/after comparison.

| Field | Recorded value |
| --- | --- |
| Account | Adaobi Okafor · KW-DEMO-1042 |
| Recorded account access | Active (simulated) |
| Paid until | Saturday 31 October 2026, 09:42 WAT |
| Account state last updated | Wednesday 28 October 2026, 09:42 WAT |
| Purchase price | ₦3,641,200 |
| Confirmed payments | ₦1,103,020 (₦1,092,400 deposit + ₦10,620 access payment) |
| Remaining purchase balance | ₦2,538,180 (717 paid-day equivalents at ₦3,540/day) |
| Recent payment | ₦10,620 · Confirmed · 28 October 2026, 09:41 WAT · DEMO-20261028-0941 |
| Recent payment effect | Added 3 paid days and reduced the balance |
| Payment form default | ₦3,540 (one paid day, minimum) |
| Time zone | Africa/Lagos (WAT, UTC+1) |

Physical power is deliberately not reported. “Active” is recorded account
access only. The Get help route states that no support request has been sent.

## Screenshot dimensions

- Browser viewport: **390 × 844 CSS px**
- Device pixel ratio: **1**
- Mobile emulation: **on**
- Output: **full page at 390 px width**, so height follows the content
- Baseline capture: **390 × 2005 px** PNG, preserved as `evidence/09-screen-without-system.png`
- Design-system capture: `evidence/10-screen-with-system.png`

The screen content, demonstration account data and viewport stay the same in
both captures. Height may differ because the design-system type scale changes
line lengths.

## Reproduce the screenshots

With Chrome installed, and the repository-root server above running:

```powershell
node tools/capture-screen.mjs http://localhost:4173/prototype/ evidence/10-screen-with-system.png 390 844
```

The script reports the viewport and final PNG dimensions. Set `CHROME_PATH` if
Chrome is installed elsewhere. Do not overwrite
`evidence/09-screen-without-system.png`.
