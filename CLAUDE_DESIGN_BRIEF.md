# AdoptIQ Design Brief — Read This Before Touching Any UI

You are building a **premium consulting intelligence platform**, not a SaaS startup dashboard.

The audience is OCM (Organizational Change Management) consultants and C-suite executives at large enterprises. They live in PowerPoint decks, boardrooms, and Excel grids. The product should feel like it was built by Deloitte's internal tools team, not a VC-funded startup.

**The design north star:** Deloitte's authority + Linear's information density + Stripe's typographic precision + Apple's whitespace discipline.

---

## Design System File

All colors, fonts, spacing, shadows, transitions, and component classes are defined in:
```
css/design-tokens.css
```

**This file must be imported first** in any CSS stack. Never hardcode a color hex, font name, or pixel value. Always use the CSS custom properties from this file.

```css
/* ALWAYS start with this import */
@import './css/design-tokens.css';
```

---

## Brand Colors — Use These Exactly

| Token | Hex | When to use |
|-------|-----|-------------|
| `--color-navy` | `#0b1c3f` | Primary — headings, nav, borders |
| `--color-orange` | `#c75c1f` | CTA buttons, alerts, key numbers only |
| `--color-green` | `#2f7b2e` | Success states, on-track indicators |
| `--color-canvas` | `#f3f1ed` | Page background — warm cream, NOT white |
| `--color-surface` | `#ffffff` | Card/panel surfaces on top of cream |
| `--color-gold` | `#e5cc94` | Supporting accent, callouts |

**Never use:** generic teal `#2E7D8C`, generic blue `#2980B9`, or Inter font. These are the default AI outputs that make everything look the same.

---

## Typography — Strict Rules

**Headings:** Always `font-family: var(--font-display)` — Playfair Display (serif)
**Body/UI:** Always `font-family: var(--font-body)` — DM Sans
**Code/mono:** Always `font-family: var(--font-mono)` — JetBrains Mono

```css
/* RIGHT */
h1, h2, h3 { font-family: var(--font-display); }
p, button, input, td { font-family: var(--font-body); }

/* WRONG — never do this */
h1 { font-family: 'Inter', sans-serif; }
```

**Font size:** Never arbitrary px values. Use the scale tokens: `--text-display-2xl` through `--text-2xs`.

**Letter spacing:** All h1/h2 must have `letter-spacing: var(--tracking-snug)`. All uppercase labels must have `letter-spacing: var(--tracking-wider)`.

**Font weight:** Never `font-weight: 400` on headings. Use `500` or `600`.

---

## Page Background & Surfaces

Page background is **warm cream** `#f3f1ed` — not white. Non-negotiable. It's what makes it feel like a consulting deck.

```css
body { background-color: var(--color-canvas); }
.card { background: var(--color-surface); }
```

---

## Layout Principles

### 1. Full-bleed sections for key data
Timeline, heatmap, executive KPIs span edge-to-edge using `.full-bleed` or `.section-angled`. This signals importance and breaks the grid deliberately.

```html
<section class="section-angled">
  <!-- Navy background, angled bottom edge, executive KPIs here -->
</section>
```

### 2. Generous whitespace — Apple discipline
- Minimum between sections: `var(--space-12)` (48px)
- Card padding: `var(--card-padding)` (24px) — never less
- Never two cards directly adjacent — gap of at least `var(--space-6)`

### 3. Command palette (Linear-style) — Cmd+K / Ctrl+K
```javascript
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
  }
});
```
Use the `.command-palette` and `.command-palette__item` classes from design-tokens.css.

### 4. Spreadsheet-dense tables for Gate/ADKAR data
Use `.table-dense` class. Consultants want to see everything at once — no padding bloat.

### 5. Staggered entry animation on lists and grids
Wrap any list of cards or rows in `.stagger-children`. Children enter sequentially with a 40ms delay each. Already defined in design-tokens.css.

```html
<div class="stagger-children">
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

---

## Micro-interactions — Required, Not Optional

### Hover states
Every interactive element needs a hover state:
```css
transition: var(--transition-color), var(--transition-shadow);
```
Cards lift 1px:
```css
.card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
```

### Contextual toolbars
Row/card actions hidden by default, revealed on hover using `.row-actions` and `.row-action-btn` classes. Never show all actions permanently — it clutters the interface.

```html
<tr>
  <td>Release name</td>
  <td>
    <div class="row-actions">
      <button class="row-action-btn" title="Edit">✎</button>
      <button class="row-action-btn" title="View">→</button>
    </div>
  </td>
</tr>
```

### Button feedback
Buttons depress on click (`translateY(1px)`) and lift on hover (`translateY(-1px)`). Already in `.btn` classes.

### Loading states
Never show a blank area while loading. Use `.skeleton` shimmer:
```html
<div class="skeleton" style="height:24px;width:60%;margin-bottom:8px;"></div>
<div class="skeleton" style="height:24px;width:80%;"></div>
```

### Success feedback — toast notifications
After every save/update/submit, show a toast. Never silent saves.
```javascript
function showSuccess(message) {
  const toast = document.createElement('div');
  toast.className = 'toast toast--success';
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:500;';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```

### Page transitions
Add `.page-enter` class to main content container on every view change:
```javascript
mainContent.classList.remove('page-enter');
void mainContent.offsetWidth; // force reflow
mainContent.classList.add('page-enter');
```

### Inline editing
Fields that can be edited should use `.editable` class — click to edit in place, no modal required. Highlights on hover, shows focus ring on click.

---

## Chart Skin — PCF Branded, Not Default Chart.js

Apply these as Chart.js global defaults at app init. Never use Chart.js default colors.

```javascript
Chart.defaults.font.family = 'DM Sans, sans-serif';
Chart.defaults.font.size = 11;
Chart.defaults.color = '#8a96a3';

// Standard dataset color order
const PCF_COLORS = [
  '#0b1c3f',  // navy
  '#c75c1f',  // orange
  '#2f7b2e',  // green
  '#e5cc94',  // gold
  '#a59d5f',  // olive
  '#2a4a80',  // light navy
];

// Grid lines — hair-thin only
Chart.defaults.scale.grid.color = 'rgba(11,28,63,0.06)';
Chart.defaults.scale.grid.borderColor = 'transparent';

// Tooltip — dark, branded
Chart.defaults.plugins.tooltip.backgroundColor = '#021d2e';
Chart.defaults.plugins.tooltip.titleColor = '#f3f1ed';
Chart.defaults.plugins.tooltip.bodyColor = '#c8c4bc';
Chart.defaults.plugins.tooltip.borderWidth = 0;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 4;
```

No chart borders. No chart backgrounds. No legend box borders. Charts should feel like data printed on paper.

---

## Tabular Numbers — Every Numeric Column

```css
.stat-block__value, td, .badge, .adkar-score, .gate-score, .numeric {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

Apply this to any element displaying numbers. Digit columns must align perfectly.

---

## Focus / Presentation Mode

Triggered by pressing `F` key. Hides sidebar and nav, expands content edge-to-edge for executive reviews in meetings.

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      document.body.classList.toggle('focus-mode');
    }
  }
});
```

Show a hint at the bottom: `.focus-mode-hint` with text "Press F to exit presentation mode". Already styled in design-tokens.css.

---

## Empty States — Branded, With Personality

Never: "No data found." or a gray box.

Always use `.empty-state` class with a title and a message that sounds like an OCM practitioner wrote it.

```html
<div class="empty-state">
  <div class="empty-state__icon">◎</div>
  <p class="empty-state__title">No gate items assessed yet</p>
  <p class="empty-state__message">
    That usually means either everything's on track or nothing's been reviewed.
    Start with the Post-Requirements gate — it sets the baseline for everything that follows.
  </p>
  <div class="empty-state__action">
    <button class="btn btn--primary">Begin Assessment</button>
  </div>
</div>
```

Other empty state messages to use:
- Gates: *"No flags raised. Either the team is ahead of the curve or the assessment hasn't started. Worth a check-in either way."*
- ADKAR: *"Scores haven't been recorded for this release. ADKAR without data is just a framework — add the first assessment to make it real."*
- Projects: *"No projects linked to this release yet. Projects are where the work happens. Releases without projects are just dates."*
- Portfolio: *"Your portfolio is empty. Add a release to start tracking OCM readiness across your organization."*

---

## Export / Print — PCF Deliverable Quality

PDF exports and print output should look like a PCF consulting report, not a browser print. The `.print-header` class adds a branded header automatically on `@media print`.

Add this to the top of every printable view:
```html
<div class="print-header" style="display:none;">
  <span class="print-header__brand">AdoptIQ — Providence Consulting Firm</span>
  <span class="print-header__meta">Confidential · [DATE] · [RELEASE NAME]</span>
</div>
```

The `@media print` rules in design-tokens.css hide all nav, buttons, and chrome automatically.

---

## Keyboard Shortcuts to Implement

Show these in the command palette and as `.kbd` hint elements on hover.

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `F` | Toggle focus/presentation mode |
| `Esc` | Close modal / exit focus mode |
| `G then P` | Go to Portfolio |
| `G then R` | Go to Releases |
| `E` | Edit current item (when a row is selected) |
| `?` | Show keyboard shortcuts |

---

## Section Headers — Always This Pattern

Every section must open with an overline + Playfair Display heading:
```html
<p class="overline">Release Health</p>
<h2>Portfolio Status</h2>
```

Never a heading alone with no overline. The overline in orange is what creates the consulting-deck cadence.

---

## What NOT to Do

- **No teal** — not in the PCF brand, it's the generic AI default
- **No Inter font** — most common AI-generated font, makes everything look identical
- **No white page background** — always `--color-canvas` cream
- **No border-radius above 6px** on inputs/buttons — high radius reads startup, low radius reads precision tool
- **No silent saves** — every action needs toast feedback
- **No default Chart.js colors** — always use `PCF_COLORS` array
- **No generic empty state text** — every empty state needs a voice
- **No placeholder gray boxes** — use `.skeleton` shimmer or real data
- **No font-weight 400 on headings** — minimum 500
- **No permanent action menus on rows** — use `.row-actions` contextual hover pattern
- **No equal padding everywhere** — alternate between dense tables, generous cards, and full-bleed sections

---

## The Feel Test

Before finishing any UI change, ask: *"Does this look like it belongs in a McKinsey deliverable, or a startup landing page?"*

If it's the latter — something is wrong with the color, type, or spacing. Fix it before committing.

---

## Quick Reference Cheatsheet

```css
/* Page */
body { background: var(--color-canvas); font-family: var(--font-body); }

/* Headings */
h1,h2,h3 { font-family: var(--font-display); color: var(--color-navy); letter-spacing: var(--tracking-snug); font-weight: 600; }

/* Section opener */
.overline { color: var(--color-orange); font-size: var(--text-2xs); letter-spacing: var(--tracking-wider); text-transform: uppercase; font-weight: 600; }

/* Cards */
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--card-padding); box-shadow: var(--shadow-sm); transition: var(--transition-shadow), var(--transition-transform); }
.card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }

/* CTA */
.btn--primary { background: var(--color-orange); color: #fff; border-radius: var(--radius-md); }

/* Numbers */
.numeric { font-variant-numeric: tabular-nums; }

/* Interactions */
* { transition: var(--transition-color); }
```

---

## AIQ Analyst Panel — Not a Chat Widget

The AIQ panel is the most differentiating feature in the product. It must not look like a chatbot. It looks like a consulting analyst panel — dark navy, structured output, Playfair Display headings inside responses.

### Structure
```html
<div class="aiq-panel aiq-panel--open">
  <div class="aiq-panel__header">
    <div>
      <div class="aiq-panel__title">AIQ Analyst</div>
      <div class="aiq-panel__subtitle">Adoption Intelligence</div>
    </div>
    <button class="aiq-panel__close">✕</button>
  </div>

  <div class="aiq-context">
    <span class="aiq-context__label">Context</span>
    <span class="aiq-context__value">ERP System Upgrade · Gate 3</span>
  </div>

  <div class="aiq-messages">
    <!-- Suggested prompts (before first message) -->
    <div class="aiq-prompts">
      <div class="aiq-prompts__label">Ask about this release</div>
      <button class="aiq-prompt-btn">Which stakeholder groups need the most attention?</button>
      <button class="aiq-prompt-btn">What's the biggest risk before go-live?</button>
      <button class="aiq-prompt-btn">Summarize readiness across all ADKAR dimensions</button>
    </div>

    <!-- AI response (structured, not a bubble) -->
    <div class="aiq-message--ai">
      <div class="aiq-response__header">
        <span class="aiq-response__tag">Analysis</span>
        <div class="aiq-response__divider"></div>
      </div>
      <div class="aiq-response">
        <h3>Readiness Assessment</h3>
        <p>Based on current gate data...</p>
        <div class="aiq-finding">
          <p><strong>Key finding:</strong> Desire scores are lagging...</p>
        </div>
      </div>
    </div>

    <!-- Typing indicator -->
    <div class="aiq-typing">
      <div class="aiq-typing__dot"></div>
      <div class="aiq-typing__dot"></div>
      <div class="aiq-typing__dot"></div>
    </div>
  </div>

  <div class="aiq-input-area">
    <div class="aiq-input-wrap">
      <textarea class="aiq-input" placeholder="Ask about readiness, risks, or recommendations..." rows="1"></textarea>
      <button class="aiq-send-btn">→</button>
    </div>
  </div>
</div>
```

### Rules
- AI responses use `<h3>` with Playfair Display for section headings inside the response
- Key findings go in `.aiq-finding` — orange left border, subtle background
- Never use speech bubbles for AI output
- The `.aiq-context` strip always shows what release/gate the AI has awareness of
- Typing indicator uses three orange pulsing dots — never a spinner

---

## Density Toggle — Implementation

Add to the toolbar/header area:
```html
<div class="density-switcher">
  <button class="density-btn" onclick="setDensity('compact')">Compact</button>
  <button class="density-btn density-btn--active" onclick="setDensity('comfortable')">Comfortable</button>
  <button class="density-btn" onclick="setDensity('spacious')">Spacious</button>
</div>
```

```javascript
function setDensity(level) {
  document.body.setAttribute('data-density', level);
  localStorage.setItem('adoptiq-density', level);
  document.querySelectorAll('.density-btn').forEach(btn => {
    btn.classList.toggle('density-btn--active', btn.textContent.toLowerCase() === level);
  });
}

// Restore on load
const saved = localStorage.getItem('adoptiq-density') || 'comfortable';
setDensity(saved);
```

---

## Icon System — Phosphor Icons Only

Add to `<head>` in index.html:
```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
```

Use exclusively `ph ph-[icon-name]` classes. Never use emoji, unicode symbols, or other icon libraries.

```html
<!-- RIGHT -->
<i class="ph ph-chart-line icon--md"></i>
<i class="ph ph-check-circle icon--sm"></i>
<i class="ph ph-warning icon--md"></i>

<!-- WRONG -->
<span>⚠️</span>
<i class="fas fa-chart-line"></i>  <!-- FontAwesome — do not use -->
```

Key icons for AdoptIQ:
- Release: `ph-rocket-launch`
- Gate: `ph-flag-checkered`
- ADKAR: `ph-chart-bar`
- Risk/Warning: `ph-warning`
- On track: `ph-check-circle`
- Project: `ph-folder`
- Timeline: `ph-calendar`
- AI/AIQ: `ph-sparkle`
- Export: `ph-export`
- Settings: `ph-gear`
- Dashboard: `ph-squares-four`
- User/Stakeholder: `ph-users`

---

## Landing Page — Structure & Rules

The landing page must feel like the same product as the app. Use the same font imports, color tokens, and spacing.

**Required sections in order:**
1. `<nav>` — logo left, nav links center, "Book a Demo" CTA right (navy bg or transparent over cream)
2. `.hero` — eyebrow overline, Playfair Display headline, subhead, two CTAs, social proof strip
3. `.stats-strip` — navy background, 3–4 key numbers (releases managed, time saved, etc.)
4. Feature blocks — alternating `.feature-block` and `.feature-block--reverse`
5. `.cta-banner` — full navy, Playfair headline, orange CTA button
6. Footer — cream bg, PCF mark, nav links, legal

**Hero headline formula:**
- Never generic ("The OCM Platform for Modern Teams")
- Always specific to the pain ("Stop managing OCM in spreadsheets.")
- Use `<em>` for the italic orange word

```html
<h1 class="hero__headline">
  Replace the spreadsheet.<br>
  Own the <em>outcome.</em>
</h1>
```

**The hero preview image must be dynamic** — not a static screenshot. Use an iframe or a live-rendered mini dashboard that updates with real data.

---

## Accessibility — Non-Negotiable

These are not optional. Enterprise clients run accessibility audits before purchasing.

### Add to every page
```html
<!-- First element inside <body> -->
<a class="skip-link" href="#main-content">Skip to main content</a>

<!-- Main content wrapper -->
<main id="main-content" tabindex="-1">
```

### ARIA labels on all icon-only buttons
```html
<!-- WRONG -->
<button><i class="ph ph-export"></i></button>

<!-- RIGHT -->
<button aria-label="Export to PDF"><i class="ph ph-export"></i></button>
```

### Color contrast requirements
- Body text on cream `#f3f1ed`: use `#1a2a3a` (passes AA at 7.2:1)
- Orange `#c75c1f` on white: passes AA for large text only — never use orange for small body text
- Navy `#0b1c3f` on cream: passes AAA — preferred for all important text

### Keyboard navigation
All interactive elements must be reachable by Tab. Test by unplugging your mouse and navigating the entire app using only keyboard. Any element you cannot reach is a bug.

### Screen reader labels
All charts must have `aria-label` or `<figcaption>`:
```html
<canvas id="chart-trend-gate"
  role="img"
  aria-label="Gate readiness trend: improving from 62% in January to 81% in April">
</canvas>
```

---

## Complete Claude Code Prompt

Use this single prompt to apply everything at once:

```
@CLAUDE_DESIGN_BRIEF.md @css/design-tokens.css @css/adoptiq.css @index.html @js/adoptiq.js

Read both the design brief and the design tokens file completely before making any changes.

Apply all of the following in one pass:

CSS (adoptiq.css):
- Import design-tokens.css first
- Replace all hardcoded colors with token variables
- Replace all fonts with --font-display (headings) and --font-body (everything else)
- Set body background to var(--color-canvas)
- Add hover lift to all cards
- Add transition: var(--transition-color) to all interactive elements
- Apply font-variant-numeric: tabular-nums to all numeric elements

HTML (index.html):
- Add Phosphor Icons CDN link to <head>
- Add Google Fonts import for Playfair Display and DM Sans
- Add skip-link as first element in <body>
- Add id="main-content" to the main wrapper
- Add aria-label to all icon-only buttons
- Add aria-label to all canvas/chart elements
- Replace any emoji or FontAwesome icons with Phosphor ph-* classes
- Add class="overline" to section label elements above headings
- Add density switcher to the main toolbar
- Add data-density="comfortable" to <body>

JavaScript (adoptiq.js):
- Add Chart.js global defaults (PCF_COLORS, grid, tooltip) at app init
- Add showSuccess() toast function and wire to all save/update actions
- Add setDensity() function with localStorage persistence
- Add Cmd+K command palette keyboard listener
- Add F key focus mode toggle listener
- Redesign the AIQ panel markup to use aiq-panel, aiq-messages, aiq-response, aiq-finding classes
- Add page-enter animation class on all view transitions
- Add stagger-children class to all card grids and release lists

Do not change application logic, Supabase calls, or data fetching.
After all changes, review against the "What NOT to Do" list and fix any violations.
```
