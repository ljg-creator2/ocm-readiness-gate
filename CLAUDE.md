# AdoptIQ: instructions for Claude Code

## Design system (required)
All UI work must follow `docs/ADOPTIQ_DESIGN_SYSTEM.md` and the approved mockups in `design-reference/` (the full Command Center screen is `adoptiq-approved-command-center-screen.png`). The mockups are specifications, not suggestions: match their layout, proportions and styling, and compare a screenshot against them before calling a screen done.
- Change colours, fonts and shared component styles in `css/system.css` only.
- Burnt orange is brand and primary action only, never a status. Status is teal / ochre / brick, always with a word and a shape.
- Do not add Command Center sections or new accent colours without approval. The Command Center has five rows: greeting + banner, four KPIs, Readiness Trend + My Action Items, Recent Activity (full width), Upcoming Milestones (full-width horizontal timeline). Never reintroduce the Change Ecosystem diagram, Top Initiatives by Readiness, or Initiative Health.

## Typography (required)
- `--font-display: 'Playfair Display', Georgia, serif` for landing headlines, the Command Center greeting, sign-in headings and editorial statements (weights 600–700).
- `--font-body: 'Inter', Arial, sans-serif` for everything else: navigation, buttons, forms, body, KPIs, tables, charts, lists (weights 400–700).
- Both are self-hosted in `fonts/` and declared in `css/system.css`. Georgia and Arial are fallbacks only. Never retype the logo; use the SVG assets in `img/brand/`.

## Product rules
- Preserve existing functionality: calculations, Supabase persistence, authentication, roles and view-only mode, exports, the demo flow, and the booking form.
- Never show fabricated metrics. Use real data or an empty state that says what is missing.
- Keep AI features off for live (non-demo) data unless the client approves.

## Working rules
- Build, then publish a preview. Push to GitHub only after LaKenya approves the preview.
- Stack: a single-page app (`index.html`, `js/adoptiq.js`), no build step. Run a syntax check with `node -e "new Function(require('fs').readFileSync('js/adoptiq.js','utf8'))"`.
