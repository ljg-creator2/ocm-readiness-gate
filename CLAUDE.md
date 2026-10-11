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

## Training-led OCM model (required)
- Training records live in `p.training` (workflows, objectives, scenarios, deliverables, dependencies, checkpoints, actions, outcomes, history). All rules are in `js/training-engine.js` (pure, no DOM); screens are in `js/training-ui.js`; the fictional demo is in `js/training-demo.js`. Run `node tests/engine.test.js` after any engine change.
- Migration is additive and idempotent (`TE.migrate`, called from `migrateResources`). Never remove or rename legacy fields (`gateState`, `depHM`, `craid`, `postLaunch`, `sustainment`).
- Never blend measures into one readiness score. The seven measures stay separate; a critical unmet condition always makes delivery readiness Blocked; an ADKAR Ability gap caps learner ability at Conditional. Unrated ADKAR dimensions are "Not assessed", never 3.
- An accepted exception needs rationale, approver and date and is never shown as Satisfied. A dependency or workflow change flags linked work for review; nothing is ever validated automatically.
- Training gives a recommendation; release governance decides. Entry conditions are suggested defaults, not SOP mandates.
- Environments are settings, not code: each release keeps its list (`r.trEnv`) and recorded deployments and refreshes. A deployment or refresh marks earlier passing scenario runs in that environment for a re-run. A pass in QA or UAT never validates a learner scenario. Do not hard-code one client's environment names, teams or maintenance windows.
- Delivery tracker import (`js/tracker-import.js`, pure): the lead's tracker owns dates, owners, status and sign-offs; AdoptIQ owns evidence, which the import never touches. Every change is previewed before it applies, nothing is deleted, "TBD" releases go to a "Release TBD" holding area, and unmatched rows are chosen by a person (choices are remembered). Never commit a real tracker.
- Gate completion (share of criteria marked met) is labelled "Gate completion (legacy)" and must not be presented as readiness.
- Project navigation has eight primary tabs (`TR_GROUPS` in `js/training-ui.js`); every legacy tab id still works through `goPTab` and `openProjectFromPortfolio`.

## Working rules
- Build, then publish a preview. Push to GitHub only after LaKenya approves the preview.
- Before every preview, run the automated checks: `cd tests && npm test` (see `tests/README.md`). They also run on GitHub for every pull request; do not merge with a red check. Add or update a test with every behaviour change. Never put a real client Jira export in the repository.
- Stack: a single-page app (`index.html`, `js/adoptiq.js`, plus `js/training-*.js` and `css/training.css`), no build step. Syntax-check each script with `node -e "new Function(require('fs').readFileSync('js/adoptiq.js','utf8'))"` (repeat for the training files).
