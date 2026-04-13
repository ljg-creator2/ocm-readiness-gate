# AdoptIQ — Providence Consulting Firm

**Enterprise Change Readiness & Adoption Intelligence Platform**

AdoptIQ is a portfolio-level OCM command center built on ADKAR, Kirkpatrick, and SDLC gate methodology. It gives OCM leaders a single dashboard to track readiness, manage risks, balance workload, and drive adoption at scale — no server required.

---

## What It Does

### Portfolio View
- **Executive Dashboard** — KPI strip, AI-generated insights, "What Changed This Week" with trend charts
- **Release Timeline** — Visual go-live bar chart across all releases
- **Release Cards** — RAG status, readiness score, ADKAR average, open issues per release
- **Portfolio Risk Dashboard** — Aggregated CRAID rollup: top open risks, severity distribution, and per-release breakdown
- **People & Capacity** — Two-tab panel:
  - *OCM Workload* — Resource roster grouped by utilization (Heavy / Active / Available), release comparison, cross-release overlap detection
  - *Saturation Intelligence* — Stakeholder group saturation heatmap with AI forecast, What If, and Sequencing modes

### Release View
- Project cards with OCM gap badges
- Release KPIs: Readiness, ADKAR, OCM Coverage, Open Risks
- CRAID Risk Summary — top risks across all projects in the release
- Dependency heatmap

### Project View
Tabbed project detail with:
- **Gates** — SDLC readiness gate checklist
- **Stakeholders** — ADKAR/Kirkpatrick scoring per stakeholder group
- **Assessment** — Framework survey (ADKAR or custom)
- **Adoption Risk** — 6-factor risk scoring
- **Dependency Map** — Cross-project dependency visualization
- **CRAID Log** — Full Constraints, Risks, Assumptions, Issues, Dependencies register with severity, probability × impact, owner, due date, and mitigation tracking

---

## CRAID System

Each project maintains a CRAID log with five entry types:

| Type | Badge | Statuses |
|------|-------|----------|
| Risk | R | Open, In Progress, Mitigated, Closed |
| Assumption | A | Open, Validated, Invalidated, Closed |
| Issue | I | Open, In Progress, Closed |
| Dependency | D | Open, In Progress, Closed |
| Constraint | C | Open, In Progress, Closed |

CRAID data rolls up to release and portfolio levels for executive visibility.

---

## Running the App

```bash
npx serve -l 3000
```

Then open `http://localhost:3000` in a browser. Or simply open `index.html` directly — no build step, no dependencies.

**Demo data:** Click "Load Demo" on the landing page to populate sample releases, projects, and CRAID entries.

---

## Tech Stack

- Vanilla HTML/CSS/JavaScript — no framework
- Supabase (optional backend for multi-user persistence)
- localStorage fallback for offline/single-user use
- Chart.js for trend charts and timeline
- Canvas API for dependency heatmap

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main application shell and all view HTML |
| `js/adoptiq.js` | All application logic (~9,000+ lines) |
| `css/adoptiq.css` | All styles including dark mode |
| `img/` | Brand assets |
| `sql/` | Supabase schema and migrations |
| `pulse.html` | Pulse check standalone view |

---

## Methodology

- **ADKAR** — Awareness, Desire, Knowledge, Ability, Reinforcement
- **Kirkpatrick** — L1 Reaction → L2 Learning → L3 Behavior → L4 Results
- **SDLC Gates** — 4-phase readiness gate framework
- **CRAID** — Constraints, Risks, Assumptions, Issues, Dependencies

*Providence Consulting Firm · CPTM · ATD Master Trainer · ADKAR-Aligned*
