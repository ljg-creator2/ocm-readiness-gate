# AdoptIQ — UX Microcopy
**Brand:** Providence Consulting Firm | **Platform:** AdoptIQ OCM Intelligence  
**Voice:** Confident, rooted, purpose-driven. Warm but not soft. Sharp but not cold.  
**Audience:** OCM consultants, change managers, executive sponsors, client stakeholders.

> Every line here should feel like it came from a practitioner who lives in this world — not a product team that read a Wikipedia article on change management.

---

## 1. Loading States

### Portfolio Dashboard Loading
```
Pulling your portfolio together...
```
*Alt:* `Reading the room — your release data is on its way.`

### Release Detail Loading
```
Loading release intelligence...
```

### ADKAR Scores Loading
```
Calculating readiness dimensions...
```

### Gate Tracker Loading
```
Assembling your gate status...
```
*Alt:* `Checking the gates — one moment.`

### AIQ (AI Analyst) Response Loading
```
AIQ is thinking through your portfolio...
```
*Progressive:*
- 0–2s: `Analyzing your release data...`
- 2–5s: `Cross-referencing ADKAR scores and gate status...`
- 5s+: `Almost there — this one's worth the wait.`

### Chart / Visualization Loading
```
Rendering trend data...
```

### PDF Export Loading
```
Preparing your readiness report for export...
```

---

## 2. Empty States

### Portfolio — No Releases
**Headline:** `Your portfolio is ready when you are.`  
**Body:** `Add your first release to start tracking change readiness across your organization.`  
**CTA:** `Add Release`

### Release — No Projects
**Headline:** `No projects tied to this release yet.`  
**Body:** `Projects define the work stream. Add at least one to begin tracking milestones and stakeholder impact.`  
**CTA:** `Add Project`

### Gate Tracker — No Items
**Headline:** `This gate hasn't been assessed.`  
**Body:** `Gate assessments confirm your team is ready to advance. Work through each item before requesting sign-off.`  
**CTA:** `Begin Assessment`

### ADKAR — Not Yet Assessed
**Headline:** `No ADKAR scores recorded.`  
**Body:** `ADKAR tells you where readiness is real and where it's assumed. Start with Awareness — it's the foundation everything else depends on.`  
**CTA:** `Record First Score`

### AIQ — No Conversation Yet
**Headline:** `Ask AIQ anything about this portfolio.`  
**Body:** `AIQ reads your actual release data — ADKAR scores, gate status, timelines. Ask about risk, readiness gaps, or where to focus next.`  
**Prompt suggestion:** `"Which release is most at risk right now?"`

### Evidence Tab — No Files
**Headline:** `No evidence attached.`  
**Body:** `Attach communications, training decks, or sign-off documentation to support your gate reviews.`  
**CTA:** `Attach Evidence`

### Trend Charts — No Historical Data
**Headline:** `Trends build over time.`  
**Body:** `You'll see readiness trajectories here as scores accumulate across releases. Keep assessing — the picture will form.`

---

## 3. Success Toasts

> Toasts should be brief, specific, and affirming — never generic.

| Action | Toast Copy |
|--------|------------|
| Gate item saved | `Gate item updated.` |
| Gate assessment completed | `Gate assessment recorded. Ready for the next one.` |
| ADKAR score updated | `ADKAR score saved.` |
| All ADKAR dimensions scored | `All five dimensions scored. Readiness picture is complete.` |
| Release created | `Release created. Start adding projects to build out the picture.` |
| Project added | `Project added to this release.` |
| PDF exported | `Report exported. Open it in a new tab to review.` |
| Role switched | `Viewing as [Role Name].` |
| Dark mode enabled | `Dark mode on.` |
| Dark mode disabled | `Back to light mode.` |
| Evidence file attached | `Evidence attached.` |
| Changes auto-saved | `Saved.` |
| Demo mode activated | `You're in demo mode. Explore freely — nothing here is real data.` |

---

## 4. Error States

> Structure: What happened → Why → What to do.

### Save Failed
**Toast:** `Couldn't save that change. Check your connection and try again.`  
**Persistent banner:** `Some changes didn't save. We'll retry automatically — or you can try again now.` [Retry]

### AI Unavailable
**Inline:** `AIQ is temporarily unavailable. Your data is intact — try again in a moment.`  
**If extended outage:** `AIQ is down for maintenance. Your portfolio data is unaffected.`

### Data Load Failed
**Headline:** `Couldn't load this view.`  
**Body:** `Something interrupted the request. Refresh to try again — your data is safe.`  
**CTA:** `Refresh` | `Go Back`

### Export Failed
**Toast:** `Export didn't complete. Check your browser settings and try again.`

### Session Expired
**Modal headline:** `Your session ended.`  
**Body:** `For security, sessions close after a period of inactivity. Sign back in to pick up where you left off.`  
**CTA:** `Sign In`

### Form Validation — Required Field
**Inline:** `This field is required before you can continue.`

### Form Validation — Invalid Date
**Inline:** `Go-live dates must be set in the future.`

### Supabase / Network Error
**Toast:** `Connection issue. We're working on it — your changes are queued to sync.`

---

## 5. Confirmation Dialogs

> Label buttons with the action. Never OK / Cancel.

### Delete Release
**Headline:** `Delete this release?`  
**Body:** `All projects, ADKAR scores, gate data, and evidence attached to [Release Name] will be permanently removed. This can't be undone.`  
**Confirm:** `Delete Release` | **Cancel:** `Keep Release`

### Reset Gate Assessment
**Headline:** `Reset this gate?`  
**Body:** `All status selections for [Gate Name] will be cleared. You'll need to reassess each item from scratch.`  
**Confirm:** `Reset Gate` | **Cancel:** `Keep Responses`

### Change Role (RBAC Switcher)
**Headline:** `Switch to [Role Name] view?`  
**Body:** `Your view and available actions will reflect what [Role Name] users can see and do.`  
**Confirm:** `Switch Role` | **Cancel:** `Stay as [Current Role]`

### Remove Project from Release
**Headline:** `Remove [Project Name]?`  
**Body:** `This project and its milestone data will be detached from this release. The project record itself won't be deleted.`  
**Confirm:** `Remove Project` | **Cancel:** `Keep Project`

### Exit Demo Mode
**Headline:** `Leave demo mode?`  
**Body:** `You'll return to your live portfolio. Demo data won't be affected.`  
**Confirm:** `Exit Demo` | **Cancel:** `Stay in Demo`

---

## 6. Tooltips

### ADKAR Dimensions

**Awareness**  
`Does the organization understand why this change is happening? Without a credible "why," resistance starts here.`

**Desire**  
`Do people want to support this change — or are they tolerating it? Desire can't be mandated; it has to be earned.`

**Knowledge**  
`Do people know how to change? Training and communication gaps surface here. High desire without knowledge stalls execution.`

**Ability**  
`Can people actually perform the new behaviors? Ability is where theory meets practice. Low ability means the change isn't real yet.`

**Reinforcement**  
`Are the right behaviors being recognized and sustained? Without reinforcement, change regresses. This is what makes it stick.`

### Gate Status Options

**Complete** — `All criteria for this item are met and documented.`  
**Partial** — `Some criteria are met. Note what's outstanding before requesting sign-off.`  
**Incomplete** — `This item hasn't been addressed. Resolve it before advancing the gate.`  
**Not Started** — `No progress on this item yet.`  
**N/A** — `This item doesn't apply to this release. Document the reason.`

### Readiness Score
`Composite score across ADKAR dimensions, gate completeness, and milestone health. 70+ is a solid baseline before go-live. Below 60 warrants a conversation with your sponsor.`

### Go-Live Date
`The date this release enters production. All readiness timelines and ADKAR assessments are measured against this date.`

### SDLC Phase
`Where this release sits in the software development lifecycle. Change management activities should align with — and anticipate — each phase transition.`

### Saturation Index
`A measure of concurrent change pressure across the organization. High saturation = change fatigue risk. Use this to sequence releases and protect adoption.`

---

## 7. Button Labels

### Primary CTAs
| Action | Label |
|--------|-------|
| Start demo | `Try Demo` |
| Add new release | `Add Release` |
| Add project to release | `Add Project` |
| Run ADKAR assessment | `Assess Readiness` |
| Open gate tracker | `Open Gate Tracker` |
| Export readiness report | `Export Report` |
| Ask AIQ a question | `Ask AIQ` |
| Request gate sign-off | `Request Sign-Off` |
| Book a consultation | `Book a Call` |
| Get started (landing) | `See AdoptIQ in Action` |

### Secondary / Utility Actions
| Action | Label |
|--------|-------|
| Filter portfolio | `Filter` |
| View release detail | `View Release` |
| Edit record | `Edit` |
| Attach evidence | `Attach` |
| Switch role | `Switch Role` |
| Toggle dark mode | `Dark Mode` |
| Open command palette | `Search & Commands` |
| Collapse section | `Collapse` |
| Expand section | `Show More` |

### Destructive Actions
| Action | Label |
|--------|-------|
| Delete release | `Delete Release` |
| Reset gate | `Reset Gate` |
| Remove project | `Remove Project` |
| Clear all filters | `Clear Filters` |

---

## 8. Form Placeholders & Helper Text

### Release Fields

| Field | Placeholder | Helper Text |
|-------|-------------|-------------|
| Release Name | `e.g., Online Banking 2.0` | `Use a name your stakeholders will recognize — this appears in all reports.` |
| Go-Live Date | `MM / DD / YYYY` | `The date this release enters production. All readiness timelines are measured from here.` |
| Release Owner | `e.g., Jordan Ellis` | `The accountable lead for this release. They'll receive readiness alerts.` |
| SDLC Phase | `Select phase...` | `Current development phase. Update this as the release progresses.` |
| Release Description | `What does this release do, and who does it impact?` | `A one-line summary for executive reports and stakeholder communications.` |

### Project Fields

| Field | Placeholder | Helper Text |
|-------|-------------|-------------|
| Project Name | `e.g., End-User Training` | `` |
| Project Owner | `e.g., Morgan James` | `` |
| Status | `Select status...` | `` |
| Milestone | `e.g., Training Complete` | `Milestones appear on the release timeline.` |

### Booking / Contact Form

| Field | Placeholder | Helper Text |
|-------|-------------|-------------|
| First Name | `First name` | `` |
| Last Name | `Last name` | `` |
| Work Email | `you@organization.com` | `We'll send confirmation details here.` |
| Organization | `Organization name` | `` |
| Role | `Your role or title` | `` |
| Message | `Tell us about your change initiative...` | `Not required — but the more context you share, the more we can prepare.` |

---

## 9. Onboarding / First-Run Prompts

### First Release (Empty Portfolio)
**Step 1 — Welcome prompt:**
```
Welcome to AdoptIQ.
Start by adding your first release — a system, process, or initiative your organization is rolling out. Everything else builds from here.
```
**CTA:** `Add Your First Release`

### First Gate Assessment
**Inline callout (first time user opens Gate Tracker):**
```
Gates are your checkpoints.
Each gate represents a critical transition in your SDLC. Work through the items, mark your status, and attach evidence. When a gate is complete, request sign-off to move forward with confidence.
```
**CTA:** `Start Assessment` | `Take a quick tour`

### First ADKAR Entry
**Inline callout (first time ADKAR tab is opened):**
```
ADKAR tells you where readiness is real.
Score each dimension from 1–5 based on what you're observing — not what you hope is true. Low scores aren't failures; they're where your attention needs to go.
```
**CTA:** `Record Scores` | `Learn About ADKAR`

### First AIQ Interaction
**Prompt suggestion shown before first message:**
```
AIQ reads your actual release data.
Try asking: "Which release has the lowest readiness?" or "What are the biggest risks this quarter?"
```

### Role Switcher — First Use
**Tooltip on first hover:**
```
See AdoptIQ through your stakeholder's eyes.
Switch roles to preview exactly what Executives, Client Viewers, and Team members can see and do.
```

---

## 10. Demo Mode Notices

### Demo Mode Banner (persistent, top of screen)
```
Demo Mode  ·  You're exploring AdoptIQ with sample data. No changes will be saved.
```
[Exit Demo]

### Demo Mode — Form Interaction
**Inline tooltip on form fields:**
```
Demo mode — edits here aren't saved to a live database.
```

### Demo Mode — ADD PROJECT Button Tooltip
```
In a live account, this creates a real project. In demo mode, it's for exploration only.
```

### Demo Mode — PDF Export
**Toast after export:**
```
Report exported from demo data. In your live account, this reflects your actual portfolio.
```

### Demo Mode — AIQ Response Footer
```
AIQ is responding based on sample data. Connect your live portfolio for real insights.
```

### Exiting Demo Mode (confirmation)
**Headline:** `Ready to use your own data?`  
**Body:** `Exit demo mode and connect AdoptIQ to your organization's releases, projects, and assessments.`  
**CTA:** `Get Started` | `Keep Exploring Demo`

---

## Claude Code Reference

To apply this microcopy, reference this file in your Claude Code prompts:

```
@MICROCOPY.md @js/adoptiq.js @index.html

Apply the UX microcopy from MICROCOPY.md throughout AdoptIQ. 
Priority order:
1. Replace all generic loading text (e.g., "Loading...", "Please wait") with branded loading copy
2. Implement empty states with correct headline + body + CTA from Section 2
3. Update all toast notification strings (success, error) to match Section 3 and Section 4
4. Replace OK/Cancel in all confirmation dialogs with specific action labels from Section 5
5. Add tooltip text to all ADKAR dimension labels and gate status options from Section 6
6. Audit all button labels against Section 7 — update any that are vague or passive
7. Update all input placeholders and helper text from Section 8
8. Implement first-run callouts from Section 9 using a localStorage flag (e.g., hasSeenOnboarding)
9. Add demo mode copy from Section 10 where isDemoMode is true

Do not change application logic. Copy and UX text only.
```

---

*Generated for AdoptIQ by Providence Consulting Firm | April 2026*
