# AdoptIQ Design System

**AdoptIQ, Change Intelligence.** People. Readiness. Real progress.

The visual source of truth is the approved mockup:
`design-reference/adoptiq-approved-command-center.png`

Every new page, feature or component must follow this document and that image. If a design need is not covered here, propose the addition first. Do not invent new colours, fonts, gradients or layouts.

## Files

| File | Role |
|---|---|
| `css/design-tokens.css` | Legacy token names (kept so old selectors resolve) |
| `css/adoptiq.css` | Legacy component styles (forms, tabs, gates, ADKAR, CRAID, etc.) |
| `css/brand.css` | Component layer: decision briefs, Release Radar, evidence lists, landing sections |
| `css/system.css` | **Loaded last.** Approved tokens, the re-skin of the layers above, app shell (sidebar), Command Center |

Change colours in `css/system.css` only. The other files read its variables.

## Colour

### Brand and surfaces

| Token | Hex | Use |
|---|---|---|
| `--midnight-navy` | #071B33 | Sidebar, dark surfaces |
| `--deep-navy` | #0B2545 | Headings, primary chart series, secondary buttons |
| `--burnt-orange` | #C95628 | Brand accent: active navigation, primary action, target lines |
| `--warm-ivory` | #F7F2E9 | Secondary background |
| `--soft-white` | #FCFBF9 | Application background |
| `--pure-white` | #FFFFFF | Cards and content |
| `--charcoal-navy` | #16213A | Primary text |
| `--slate` | #687280 | Secondary text |
| `--light-border` | #E7E5E1 | Dividers and card borders |

### Brand surfaces (mandatory)

Use these tokens; never write the hex directly in a component.

| Surface | Token | Hex |
|---|---|---|
| Landing hero and dark bands | `--bg-landing-hero` | #071B33 |
| Landing secondary sections | `--bg-landing-section` | #F7F2E9 |
| Sign-in left panel | `--bg-signin-brand` | #071B33 |
| Sign-in right panel | `--bg-signin-form` | #F7F2E9 |
| Command Center and app main background | `--bg-app` | #FCFBF9 |
| App sidebar | `--bg-sidebar` | #071B33 |
| Dashboard cards | `--bg-card` | #FFFFFF |
| Greeting banner | `--bg-greeting` | #F7F2E9 |
| Primary brand accent | `--brand-accent` | #C95628 |

The approved brand look is the combination of editorial serif type, dark branded surfaces, warm light backgrounds and the signature wave artwork. Colour alone is not enough.

### Status (never orange)

| Meaning | Token | Hex | Shape | Text variant |
|---|---|---|---|---|
| Positive / on track | `--teal` | #178B87 | ● | `--teal-text` #127370 |
| Caution / watch / partial | `--ochre-gold` | #D5A33D | ◆ | `--ochre-text` #8A6514 |
| Risk / at risk / overdue | `--brick-red` | #A63F32 | ▲ | same |
| Critical / blocking | #7E2E24 (deep brick) | | ■ | same |
| Training and enablement accent | `--soft-purple` | #7565D9 | — | `--purple-text` #5B4BC4 |

### Contrast adjustments (WCAG 2.2 AA, 4.5:1 for normal text)

| Pairing | Ratio | Decision |
|---|---|---|
| White on #C95628 | 4.33 | Filled buttons use `--orange-btn` #B54A20 (5.3). Hover is #963B18. |
| #C95628 text on white | 4.33 | Text links use `--orange-link` #A9441C (5.95). |
| #C95628 on midnight navy | 3.99 | Orange text on navy uses `--orange-on-navy` #E9895F (6.76). |
| Teal #178B87 on white | 4.13 | Status text uses #127370 (5.66). The icon and fill keep #178B87. |
| Ochre #D5A33D on white | 2.30 | Status text uses #8A6514 (5.31). Ochre is for fills and icons only. |
| Slate on soft white | 4.71 | Passes. |

### Rules
- Burnt orange is a brand colour, not an error colour. Never use it for warnings, risk, or destructive actions.
- Never rely on colour alone. Status labels always carry a word and a shape.
- No new accent colours or gradients. The only exception is the uploaded brand wave artwork on the landing and sign-in pages.

## Typography

| Use | Font |
|---|---|
| Wordmark | Supplied SVG logo assets in `img/brand/` (`adoptiq-logo-dark.svg` on navy, `adoptiq-logo-light.svg` on light) |
| Display headings, greeting, page titles, editorial lines | Playfair Display 600–700 (`--fw-display`, `--fw-display-strong`) |
| UI, body, navigation, tables, forms, charts | Inter 400–700 |
| KPI values | Inter 700, tabular numerals |

- Both fonts are self-hosted in `fonts/` (variable WOFF2, SIL Open Font License) and declared with `@font-face` at the top of `css/system.css`, so they load without Google Fonts. Do not add other font families.
- Do not use Playfair in tables, navigation, form fields or charts.
- Avoid all-caps except small section labels and table headers.

## Shape, spacing, elevation
- **Radii:** cards and panels 12px; buttons and inputs 8px; chips and status labels 6px.
- **Spacing:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48.
- **Card shadow:** `--shadow-card` (very light). Pop-ups, menus and drawers use `--shadow-pop`.

## Sign-in (approved layout)
- **Left panel** (`--bg-signin-brand`): logo (links back to the landing page), "People. Readiness. Real progress." in Playfair with a burnt-orange rule, and the wave artwork.
- **Right panel** (`--bg-signin-form`): "Welcome back.", email, password with show/hide, Keep me signed in, Forgot password?, a navy Sign In button, an "or" divider, Sign in with Microsoft, and "New to AdoptIQ? Request a demo".
- **Microsoft sign-in** uses Supabase's Azure provider. Until Azure is enabled in Supabase (Authentication → Providers), the button says so instead of failing.
- **Keep me signed in:** checked keeps the normal persistent session; unchecked signs the browser out when the tab or window closes.
- Create account, reset password and email verification use the same panel and the same Supabase calls.

## App shell
- **Sidebar:** midnight-navy, fixed, 232px wide. Wordmark at the top, eight sections, and profile, theme, role and sign-out at the bottom.
  - The active item uses a burnt-orange fill with white text.
  - It collapses to 72px icons under 1100px and becomes a drawer (☰) under 760px.
- **Section mapping** (nothing removed; every existing view and tab stays reachable):

| Sidebar | Opens | Existing modules |
|---|---|---|
| Command Center | home | KPIs, Readiness Trend, My Action Items, Recent Activity, Upcoming Milestones |
| Initiatives | portfolio list | Executive Readiness Brief, Release Radar, release cards, release and project pages |
| People & Impacts | project index | Impact, Gaps, Adoption Map tabs |
| Readiness & Risk | project index | Gate Tracker, ADKAR, Lifecycle, Open Issues, Dependency Map, CRAID |
| Training & Enablement | project index | Training Timeline |
| Stakeholders | project index | Adoption Scoring, Pulse |
| Adoption & Outcomes | project index | Post-launch, Sustainment |
| Reports | export index | Status report, Handoff PDF, Release PDF, Audit log |

## Command Center (approved layout; do not add sections)
1. **Header:** search (releases, initiatives, stakeholder groups), month, notifications (from the alert rules), help, avatar.
2. **Greeting:** "GOOD MORNING, {FIRST NAME}." and "Here's where your change initiatives stand today."
3. **Four KPI cards:**
   - Active Initiatives (projects not Complete / On Hold)
   - Overall Readiness (average gate readiness)
   - At-Risk (initiatives not On Track)
   - Training Completion (average recorded completion)
4. **Readiness Trend:**
   - Readiness from weekly snapshots
   - Adoption from post-launch observations (go-live + 30/60/90 days)
   - Risk = % of initiatives at risk
5. **My Action Items:** next actions and blocking gate items, with initiative and due date.
6. **Recent Activity:** audit log plus record events (imports, interventions, proof points, touchpoints, updates).
7. **Upcoming Milestones:** horizontal timeline of go-live, UAT, Tech Transfer, training and post-launch checkpoints.

Explicitly excluded: Change Ecosystem diagram, Top Initiatives by Readiness, Initiative Health, and any other widget.

**Data rule:** every value comes from existing application data and calculations. Mockup numbers are illustrative only. When data is missing, say so in an empty state; never show a placeholder number.

## Charts
- **Series colours:** readiness = deep navy, adoption = teal, risk = brick, target = burnt orange (dashed).
- **Styling:** no gradients, minimal gridlines, legend above the chart, a one-sentence caption below.
- **Accessibility:** every chart has an `aria-label` and a text summary.

## Accessibility
- **Standard:** WCAG 2.2 AA.
- **Focus:** a visible focus ring (burnt orange, 2px).
- **Motion:** honours `prefers-reduced-motion`.
- **Keyboard:** reaches every control, including the sidebar drawer, search results, the notifications and the milestone scroller.
