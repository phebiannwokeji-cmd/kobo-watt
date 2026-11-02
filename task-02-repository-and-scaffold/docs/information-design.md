# Information Design and Responsive Typography

**Deliverable:** Task 2, Step 10 (`docs/information-design.md`)  
**Associated Evidence:**
- [16-head-route-one.png](../evidence/16-head-route-one.png) — Rendered `<head>` on Marketing Home (`/`)
- [17-head-route-two.png](../evidence/17-head-route-two.png) — Rendered `<head>` on Account Prototype (`/demo/`)
- [18-heading-wrap-bad.png](../evidence/18-heading-wrap-bad.png) — Heading clipping without responsive clamp
- [19-heading-wrap-good.png](../evidence/19-heading-wrap-good.png) — Intentional heading wrap with max-width
- [20-responsive-three-widths.png](../evidence/20-responsive-three-widths.png) — Sizing verified across 320px, 390px, and 768px viewports
- [21-information-design-checks.txt](../evidence/21-information-design-checks.txt) — Automated verification output

---

## 1. The Head: Configuration and Route-Aware Metadata

An application’s `<head>` configures browser behaviour, accessibility, discovery, and social sharing. In Task 2, metadata is explicitly scoped by route rather than using static strings:

### 1.1 Dynamic Route Titles
- **Home Route (`/`):** `<title>Kobo Watt — solar access and payments</title>`
- **Prototype Route (`/demo/`):** `<title>Account summary — Kobo Watt demonstration</title>`
- **Verification:** As evidenced in [16-head-route-one.png](../evidence/16-head-route-one.png) and [17-head-route-two.png](../evidence/17-head-route-two.png), navigating between routes updates the browser document title to reflect user context.

### 1.2 Tagline
- Added as a distinct heading sub-element: `Track solar access and payments.` (5 words, strictly under the 10-word ceiling).

### 1.3 Marketing-Only SEO Tags
- Kept strictly on `/`:
  - `<meta name="description" content="Kobo Watt is a fictional rent-to-own solar and inverter service in Ikeja, Lagos. Track recorded access and simulated payments.">`
  - `<meta name="robots" content="index,follow">`
  - `<meta name="theme-color" content="#006b5e">` (Primary 40 brand token)
- The `/demo/` prototype explicitly omits indexing tags to avoid polluting search indexes with fictional user dashboards.

### 1.4 Custom Favicon
- Authored custom SVG favicon with the brand primary tone (`#006b5e`) and high-contrast bolt glyph (`#ffffff`): `/assets/favicon.svg`.
- Explicit Express routes serve `/assets/favicon.svg` and alias `/favicon.ico` to ensure zero console 404s.

### 1.5 OpenGraph Social Meta
- Added `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, and `twitter:card`:
  - Image: `/assets/og-image.png` (1200×630px high-resolution preview with brand identity).
  - Previews shared on Slack, WhatsApp, or Twitter display the branded card instead of an unstyled URL.

---

## 2. The Body: Pruning and Hierarchy

### 2.1 Removing Redundancy
- **What was removed:** A duplicate paragraph above the enquiry form that repeated the demonstration disclaimer already stated in the page hero.
- **Why:** Having multiple competing disclaimer blocks diluted user focus and created visual noise. The disclaimer was unified into a single accessible note (`#demo-notice`), which the enquiry form references via `aria-describedby="demo-notice"`.

### 2.2 Collapsing Unnecessary Choices
- Rather than presenting competing "Sign in", "Register", and "Explore" buttons before a first-time visitor understands what Kobo Watt is, the hero presents a single primary call to action: `View demo account` (`/demo/`).
- The fictional enquiry section sits below the hero as a secondary exploration area for users wanting to test solar sizing.

### 2.3 Intentional Heading Wrapping
- Without a maximum width, the `h1` stretches awkwardly across wide viewports, creating an uneven reading rhythm.
- Set `max-width: 18rem` (288px) on `.page h1`. This forces "Power for your business" to wrap into a balanced two-line shape across mobile and desktop, directing eye movement down toward the explanation and call to action (verified in [19-heading-wrap-good.png](../evidence/19-heading-wrap-good.png)).

### 2.4 Relative Sizing and Rem Units
- Buttons and action links avoid fixed `width` or `height`.
- Sizing uses rem padding:
  - `padding: var(--kw-btn-padding-y) var(--kw-btn-padding-x);` (0.75rem vertical, 1.5rem horizontal).
  - `border-radius: var(--kw-radius-small);` (0.25rem / 4px).
- **Reason:** Rem-based padding expands fluidly if the user adjusts system root font sizes or if translations require longer phrasing, preventing text clipping.

### 2.5 Design System Typography Enforcement
- Buttons and interactive links strictly consume Task 1's `kw-typography-label-large`:
  - `font-family: "Source Sans Pro", sans-serif`
  - `font-size: 14px` (0.875rem)
  - `font-weight: 600` (SemiBold)
  - `letter-spacing: -0.15px`

---

## 3. Interaction and Fluid Responsiveness

### 3.1 Pointer and Visible Focus Feedback
- All interactive links (`.brand`, `.text-link`, button elements) declare `cursor: pointer`.
- The logo `.brand` is wrapped in an `<a>` linking to `/` with hover underline feedback.
- Focus outlines use the Task 1 primary token: `3px solid var(--kw-color-primary)` with `2px` offset.

### 3.2 Responsive Text Scaling with `clamp()`
- **The Failure State:** When scaled to extremely narrow viewports (e.g. 180px), fixed 40px display typography caused the heading box (133px width) to overflow (`scrollWidth: 143px`), clipping characters offscreen (captured in [18-heading-wrap-bad.png](../evidence/18-heading-wrap-bad.png)).
- **The Solution:** Implemented CSS fluid typography using `clamp()`:
  ```css
  font-size: clamp(2rem, 5vw + 1rem, 2.5rem);
  line-height: clamp(2.5rem, 6vw + 1rem, 3.75rem);
  ```
- **Verification:** As demonstrated in [20-responsive-three-widths.png](../evidence/20-responsive-three-widths.png) and recorded in `21-information-design-checks.txt`:
  - At **320px** (small mobile): Font renders at 32px, text width 273px, zero horizontal overflow.
  - At **390px** (standard mobile): Font renders at 32px, heading width 288px, zero overflow.
  - At **768px** (tablet/desktop): Font scales fluidly to 40px, heading width cleanly constrained at 288px.
