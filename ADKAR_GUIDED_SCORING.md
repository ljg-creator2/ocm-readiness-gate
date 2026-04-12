# AdoptIQ — ADKAR Guided Scoring Spec
**For:** Claude Code implementation  
**Audience:** New consultants with no prior Prosci training  
**Design principle:** Teach the model through the work, not before it.

---

## How This File Works

Every ADKAR scoring interaction in AdoptIQ should follow this structure:

1. **The question** — plain language, what you're actually trying to find out
2. **The field prompt** — what to go observe or ask before scoring
3. **Score anchors** — 1–5 with concrete, observable behavioral examples
4. **Barrier indicator** — flag scores below 3 as a barrier point
5. **Sequential logic** — show which downstream scores are affected
6. **The intervention** — what a consultant does when the score is low

Present one dimension at a time in assessment mode. Do not show all five simultaneously until the summary view.

---

## The ADKAR Journey (Framing Copy)

Show this the first time a new user opens the ADKAR panel. Dismissable. Saveable as reference.

```
Every person going through a change moves through five stages — in order.

Your job isn't to push people through them.
Your job is to find out where they're stuck, and remove what's blocking them.

ADKAR tells you where to look.
```

**The chain (visual metaphor — render as a horizontal flow, not a list):**

```
WHY is it happening?  →  Do they WANT it?  →  Do they know HOW?  →  CAN they do it?  →  Will it STICK?
     Awareness               Desire               Knowledge              Ability            Reinforcement
```

Below each arrow:
```
Can't skip. Can't reverse. Low score here → everything to the right is unreliable.
```

---

## Dimension 1: Awareness

### The Question
> *Does this group understand why this change is happening and what happens if it doesn't?*

### The Field Prompt (shown before scoring)
```
Before you score, ask yourself:

In your conversations with this group, can people tell you — in their own words —
why this change is happening and what's driving it from the top?

Not just the project name. The reason.
```

**Coaching note for new consultants (collapsible):**
```
Tip: "We're going to a new system" is not Awareness.
"We're moving to a new system because the current one can't support the growth we're targeting
and leadership made the call in Q1" — that's Awareness.

If people know the what but not the why, score this no higher than a 2.
```

### Score Anchors

| Score | Label | What You Observe |
|-------|-------|-----------------|
| 1 | No signal | People don't know this change is happening, or they've heard a rumor with no substance |
| 2 | Name only | People know the project name or that "something is changing" but can't say why |
| 3 | Partial | Some people can explain the why, others can't. Messaging has reached parts of the group |
| 4 | Solid | Most people can explain the reason for the change in their own words, consistently |
| 5 | Anchored | The group can articulate the why, the urgency, and the consequence of not changing |

### Barrier Point (score < 3)
```
⚠ Awareness is your barrier.

If people don't understand why this change is happening, Desire is almost meaningless —
you can't want something you don't understand.

Fix Awareness first before drawing conclusions from any other score.
```

### Intervention — When Awareness is Below 3

```
What a consultant does:

1. Find the communication gap
   Talk to a few people and ask: "What have you heard about this initiative?"
   Listen for: silence, rumor, or wrong information. That tells you where the message broke down.

2. Get a leader visible
   Awareness moves fastest when it comes from a trusted leader, not a project team.
   Work with your sponsor to identify 1–2 leaders who can deliver the message directly —
   town hall, team meeting, or even a short video.

3. Make the "why" impossible to miss
   One-pagers, digital signage, manager talking points.
   The message needs multiple touchpoints — one email is not Awareness.

4. Address the "what happens if we don't" question
   People need to understand the consequence of not changing, not just the benefit of changing.
   This is what converts passive acknowledgment into real attention.
```

**Client-facing language (how to explain a low Awareness score):**
```
"Right now, most of the team knows something is coming, but they can't tell you why it matters
or why it's happening now. Before we build momentum, we need the leadership message to land.
That's the first thing we address."
```

---

## Dimension 2: Desire

### The Question
> *Does this group want to support this change — or are they tolerating it?*

### The Field Prompt (shown before scoring)
```
Before you score, ask yourself:

When you talk to people in this group, do they seem invested in making this work?
Or do they seem like they're waiting to see what happens?

Desire isn't enthusiasm. It's active willingness to participate and not block.
```

**Coaching note for new consultants (collapsible):**
```
Tip: Desire cannot be mandated — and it can't be faked for long.
Someone who says "yes" in a meeting and does nothing afterward has low Desire.
Watch behavior, not words.

Also: Desire is personal. Different subgroups within the same team can have very different scores.
When in doubt, segment — score managers separately from individual contributors.
```

### Score Anchors

| Score | Label | What You Observe |
|-------|-------|-----------------|
| 1 | Active resistance | People are openly opposed, pushing back publicly, or trying to block the change |
| 2 | Passive resistance | People are compliant in meetings but disengaged, skeptical, or quietly undermining |
| 3 | Neutral | People will participate if asked but are not invested; change feels like something happening to them |
| 4 | Supportive | People are willing and generally positive; they ask questions and show up |
| 5 | Advocates | People actively champion the change, bring others along, and hold peers accountable |

### Barrier Point (score < 3)
```
⚠ Desire is your barrier.

You can train people who don't want to change.
You cannot make that training stick.

Resistance — whether active or passive — is the most common reason change initiatives fail
after go-live. This is the dimension that requires the most direct conversation.
```

### Intervention — When Desire is Below 3

```
What a consultant does:

1. Find out what's behind the resistance
   Resistance always has a reason. Ask: "What concerns do you have about this change?"
   Listen without defending. The reasons matter more than the complaints.
   Common blockers: fear of losing status, more work without more pay, don't trust leadership's motives.

2. Address WIIFM directly
   WIIFM = "What's in it for me?"
   This is not about selling the company's benefit — it's about answering the personal question.
   What does this change mean for someone's day-to-day work, career, workload, or role security?

3. Remove structural blockers
   Sometimes resistance isn't attitude — it's that people can see a real problem the project team missed.
   Listen for that. If it's valid, escalate it. Fixing a real problem earns trust faster than any messaging.

4. Find your advocates
   Even in a resistant group, there are usually 1–2 people who are positive or neutral.
   Bring them in. Peer influence moves Desire more than consultant influence.

5. Give your sponsor work to do
   Sponsor visibility signals that the organization is serious.
   Absent or silent sponsors tell people the change isn't real — which confirms low Desire.
```

**Client-facing language:**
```
"The team understands this is happening, but right now they don't feel ownership over it.
Before we go further with training or process changes, we need to address some concerns
that are creating friction. That's a conversation, not a communication."
```

---

## Dimension 3: Knowledge

### The Question
> *Does this group know how to make this change — in practice, not in theory?*

### The Field Prompt (shown before scoring)
```
Before you score, ask yourself:

If the system went live tomorrow, could people do their jobs?
Not "did they attend training." Not "were they sent the user guide."

Could they actually do it?
```

**Coaching note for new consultants (collapsible):**
```
Tip: Training completion rate is not a Knowledge score.
Attendance is an input. Retention and application are the output.

Ask a few people to walk you through how they would complete a common task in the new process.
What they can and can't do tells you more than any completion dashboard.
```

### Score Anchors

| Score | Label | What You Observe |
|-------|-------|-----------------|
| 1 | No knowledge | No training has occurred; people have no exposure to new processes or systems |
| 2 | Awareness of training | Training exists or is planned, but hasn't been delivered or wasn't retained |
| 3 | Basic knowledge | People have been trained and can recall the general process, but need significant support |
| 4 | Operational knowledge | Most people can perform key tasks with minimal support; some edge cases need help |
| 5 | Embedded knowledge | People can perform all tasks independently and can help train others |

### Barrier Point (score < 3)
```
⚠ Knowledge is your barrier.

High Desire with low Knowledge is one of the most frustrating states for employees —
they want to do the right thing but don't know how.

That frustration converts to disengagement fast if it isn't addressed.
```

### Intervention — When Knowledge is Below 3

```
What a consultant does:

1. Audit what training has actually happened
   Not what was planned or sent — what was received and retained.
   Pull completion data AND do spot-check conversations. The gap between those two numbers is your problem.

2. Build role-specific job aids
   Generic training manuals don't create Knowledge. Role-specific, task-specific reference cards do.
   What does an accounts payable clerk need to know? That's different from what a manager needs.
   Break it down by role.

3. Create practice opportunities before go-live
   Sandbox environments, simulations, rehearsals.
   People need to make mistakes before they're live — not after.

4. Identify floor support resources
   Who can someone ask a question on day one? Make sure that person exists and is visible.
   Super-users, change champions, and a clear help channel all reduce Knowledge anxiety.

5. Schedule reinforcement training
   One training session is never enough. Plan a 30-day check-in.
   What questions came up? What did people actually struggle with? Run a targeted session on that.
```

**Client-facing language:**
```
"People are willing to make this work, but right now the training hasn't built the confidence
they need to perform independently. We need to add role-specific practice time and make sure
floor support is in place for the first two weeks after go-live."
```

---

## Dimension 4: Ability

### The Question
> *Can this group actually perform the new behaviors — not just describe them?*

### The Field Prompt (shown before scoring)
```
Before you score, ask yourself:

Is the gap between knowing and doing closed?

Knowledge is what's in someone's head.
Ability is what they can do with their hands, in their actual work environment,
under real conditions.
```

**Coaching note for new consultants (collapsible):**
```
Tip: Ability is where process failures and system barriers live.
Sometimes people know exactly what to do — and can't do it because the system won't let them,
their manager won't approve it, or the new process contradicts an old policy no one updated.

When Ability is low, ask: "Is this a skill gap or a barrier?" The interventions are very different.
```

### Score Anchors

| Score | Label | What You Observe |
|-------|-------|-----------------|
| 1 | Cannot perform | People have not attempted the new behavior or system; no demonstrated capability |
| 2 | Attempted, struggling | People have tried but are making errors, reverting to old behavior, or asking for constant help |
| 3 | Performing with support | People can complete tasks but need help with exceptions, edge cases, or less common scenarios |
| 4 | Performing independently | Most people handle their daily work without support; exceptions are manageable |
| 5 | Proficient | People perform fluently, handle edge cases confidently, and can coach peers |

### Barrier Point (score < 3)
```
⚠ Ability is your barrier.

This is the gap between training and performance.
Until people can do the work, adoption is not real — regardless of what any other metric shows.
```

### Intervention — When Ability is Below 3

```
What a consultant does:

1. Separate skill gaps from system barriers
   Ask: "What's getting in the way of doing this?"
   If the answer is "I don't know how" → skill gap (go back to Knowledge interventions)
   If the answer is "the system won't let me" or "I need my manager's approval" → process/system barrier

2. Address process barriers immediately
   Broken workflows, missing access rights, conflicting policies — these are project team problems,
   not change management problems. Escalate them. Document them. Get them fixed.

3. Add on-the-job coaching
   Instructor-led training in a classroom doesn't build Ability.
   A coach sitting next to someone while they do their actual work does.
   Even one session per person makes a significant difference.

4. Extend your support window
   If go-live already happened and Ability is still low, extend hyper-care.
   Pull back the go-live support team. Don't declare success until people can work without it.

5. Track error rates and help desk volume
   These are the leading indicators of Ability. If tickets are climbing, Ability is low.
   If they're declining week over week, the change is taking hold.
```

**Client-facing language:**
```
"We've done the training, and people understand what's expected — but there's still a gap
between knowing and doing. Some of that is skill, and some of it is friction in the process itself.
We need two or three more weeks of floor support and we need to get three process issues resolved
before we can call this adoption."
```

---

## Dimension 5: Reinforcement

### The Question
> *Are the right behaviors being recognized, sustained, and protected — or is the organization quietly reverting?*

### The Field Prompt (shown before scoring)
```
Before you score, ask yourself:

Is this change holding?

Three months from now, will people still be using the new process —
or will they have drifted back to what's comfortable?
Reinforcement is what separates a change that sticks from one that gets "piloted forever."
```

**Coaching note for new consultants (collapsible):**
```
Tip: Reinforcement is often skipped because it happens after go-live,
and most project teams have moved on.

This is the most common cause of change failure that nobody talks about.
The go-live was a success. Six months later, nobody uses the new process.
That's a Reinforcement failure.
```

### Score Anchors

| Score | Label | What You Observe |
|-------|-------|-----------------|
| 1 | No reinforcement | No recognition, accountability, or follow-through; reversion to old behavior is visible |
| 2 | Informal only | Individual managers may be reinforcing, but no organizational mechanism exists |
| 3 | Partial | Some formal reinforcement exists (recognition, metrics), but not consistently applied |
| 4 | Consistent | Formal recognition, accountability, and performance metrics are in place and applied |
| 5 | Embedded | New behaviors are the norm; old behaviors are visibly corrected; change is part of the culture |

### Barrier Point (score < 3)
```
⚠ Reinforcement is your barrier.

Without it, the change will regress.
People will default to what's comfortable — not because they're resistant,
but because no one told them the new way actually matters.
```

### Intervention — When Reinforcement is Below 3

```
What a consultant does:

1. Build recognition into existing rhythms
   Reinforcement doesn't need a new program. Look for existing meeting cadences, newsletters,
   or performance reviews where the new behavior can be called out and celebrated.
   Make the new behavior visible.

2. Connect behavior to performance metrics
   If the change isn't reflected in what managers measure, it won't hold.
   Work with HR and leadership to update KPIs, dashboards, and performance review criteria.

3. Create accountability without blame
   A manager who catches someone reverting to the old behavior should address it — gently.
   "We're doing it the new way now" is accountability. "You're doing it wrong" is blame.
   Train managers on the difference.

4. Run a 90-day pulse check
   Survey the group 90 days after go-live. Are they still using the new process?
   What's getting in the way? What support do they still need?
   Surface the data and act on it publicly.

5. Celebrate early adopters
   Find the people who adopted fastest and performed best.
   Tell their story. It signals to the rest of the group what "good" looks like
   and that the organization noticed.
```

**Client-facing language:**
```
"The change went live and people are using it — but we're at the most vulnerable point.
Without formal recognition and accountability in place, groups tend to drift back.
We want to build reinforcement into your normal operating rhythms before we step back."
```

---

## Post-Scoring: Summary Logic

After all five dimensions are scored, display a summary panel. Logic below:

### Identify the Barrier

```
Find the lowest score.
If two or more dimensions tie for lowest, the one earliest in the sequence is the primary barrier.
(Awareness > Desire > Knowledge > Ability > Reinforcement)
```

**Barrier display copy:**
```
Your barrier is [Dimension].

[Insert one-sentence implication from the dimension's barrier point copy above.]

Address this first. Until [Dimension] improves, downstream scores will not hold.
```

### Readiness Interpretation Table

| Composite Score (avg) | Interpretation | Guidance |
|----------------------|----------------|---------|
| 4.5 – 5.0 | Ready | This group is positioned well. Shift to Reinforcement monitoring. |
| 3.5 – 4.4 | On track | Solid foundation. Address any dimension below 3 before go-live. |
| 2.5 – 3.4 | At risk | Real gaps exist. Targeted interventions needed before go-live is advisable. |
| 1.5 – 2.4 | High risk | Significant readiness gaps. Go-live timeline should be reviewed with sponsor. |
| 1.0 – 1.4 | Not ready | This group is not prepared. A go-live decision requires sponsor awareness and deliberate mitigation. |

### Sequential Dependency Warning (show when upstream < downstream)

Trigger this logic: if Awareness < Desire, or Desire < Knowledge, or Knowledge < Ability — surface a warning:

```
⚠ Score inconsistency detected.

[Upstream dimension] is scored lower than [Downstream dimension].
ADKAR is sequential — [Downstream dimension] cannot be reliable without a solid [Upstream dimension].

Review your [Downstream dimension] score. It may be optimistic.
```

---

## Claude Code Implementation Notes

```
@ADKAR_GUIDED_SCORING.md @MICROCOPY.md @CLAUDE_DESIGN_BRIEF.md @js/adoptiq.js @index.html

Implement guided ADKAR scoring in AdoptIQ using the content in ADKAR_GUIDED_SCORING.md.

REQUIRED BEHAVIORS:

1. SINGLE DIMENSION VIEW
   Show one ADKAR dimension at a time during assessment mode.
   Use a stepper UI (Step 1 of 5, Step 2 of 5...) with back/forward navigation.
   Do not show all five dimensions simultaneously.

2. FIELD PROMPT
   Before the scoring scale appears, show the Field Prompt for that dimension.
   Include a collapsible "Coaching tip" panel beneath it (collapsed by default).

3. SCORE ANCHORS
   Replace the plain 1–5 numeric scale with a labeled scale.
   Each anchor label and behavioral description should be visible on hover/focus.
   On mobile: show anchors above and below the slider.

4. BARRIER INDICATOR
   If a score is saved below 3, display the barrier point copy immediately.
   Use a warning color (amber — NOT red, which reads as failure rather than attention needed).
   Show which downstream dimensions are affected.

5. SEQUENTIAL DEPENDENCY CHECK
   On the summary screen, run the sequential logic check.
   If upstream < downstream, display the inconsistency warning.
   Offer a "Review score" button that takes the consultant back to the flagged dimension.

6. SUMMARY PANEL
   After all five are scored, show:
   - The radar chart (readiness-radar.js)
   - The barrier dimension (highlighted)
   - The composite readiness interpretation (table above)
   - The intervention summary (first intervention bullet for each dimension below 3)
   - Client-facing language for the lowest-scoring dimension

7. FIRST-RUN FRAMING
   Show "The ADKAR Journey" framing copy the first time a user opens ADKAR scoring.
   Use a localStorage flag (hasSeenADKARIntro) to show it once.
   Include a "Show again" link in the dimension header for reference.

8. PROGRESSIVE DISCLOSURE
   Do not surface all educational content at once.
   Coaching tips are collapsed. Full intervention library is one click away.
   Score anchors are visible but descriptions are on hover.
   New consultants get what they need. Experienced users aren't slowed down.

DESIGN TOKENS TO USE:
- Barrier warning: --color-amber (define if not present: #d97706)
- Barrier background: amber at 10% opacity
- Coaching tip panel: --color-surface-secondary, left border 3px --color-orange
- Score anchors active state: --color-navy
- Sequential warning: --color-amber, icon: phosphor WarningCircle

DO NOT:
- Use a plain 1–5 number input or slider without anchors
- Show all five dimensions on a single scrollable form
- Display barriers in red (implies failure, not attention)
- Skip the summary panel after scoring is complete
```

---

*AdoptIQ ADKAR Guided Scoring Spec | Providence Consulting Firm | April 2026*
