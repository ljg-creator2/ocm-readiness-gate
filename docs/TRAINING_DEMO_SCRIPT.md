# AdoptIQ Training-led OCM demo script

All organizations, people and data in the demo are fictional. The demo is view-only. Records open read-only, so you can show every reason and its evidence without changing anything.

## Start
1. Open the site and select **Explore the Platform**.
2. On the Command Center, point out **Delivery Readiness** (KPI 2). It counts active projects whose Training records say they are ready, have conditions, or are blocked. It is not a blended score.
3. Under **Upcoming Milestones**, point out "Input needed: Renewal notice test data loaded in TRN-2". This milestone comes from a dependency record, not from a UAT date.

## Act 1: a blocked input (Benefits Renewal Notices)
Open it from **Initiatives → Benefits Modernization → Benefits Renewal Notices**.
1. **Overview & Decision Brief.** The recommendation is "Not ready for delivery". Material development is "Proceed with conditions", so development continues, while training delivery is Blocked.
2. Under **What is blocked and why**, select the first item. The dependency record opens. It shows:
   - who owns the input (App Dev, S. Alvarez) and when Training needs it
   - the consequence for Training
   - which activities are still permitted
3. **Learning Development.** QA passed (QA-301), but the scenario does not run in the training environment. QA evidence alone does not validate practice.
4. **Dependencies & Evidence → Dependency Map.** The map is a summary of the records. Selecting a cell opens the record behind it.

## Act 2: the full story, now launched (Benefits Claims Intake)
1. **Overview & Decision Brief.** The recommendation is "Ready for delivery". The decision authority is the Benefits Program Governance Board. Changes since the last review are post-launch observations.
2. **Dependencies & Evidence → All.** The environment dependency is Satisfied, with evidence ENV-77 / R1030 verified by Training.
3. **Learning Development.** The workbook exercise shows its SME review and its revision ("added the two-member household variation"). The job aid was approved while the exercise was still blocked.
4. **Readiness & Gates.** Seven separate measures and six checkpoints, each with a recorded decision and reviewer. Evidence quality is Conditional because every item of evidence is now more than 30 days old (stale). That is a prompt to re-check the evidence, not a failure.
5. **Adoption & Sustainment → Outcomes.** Measures were defined before launch, each with a baseline, target and window. Observations were recorded afterwards: rework-free registrations went from 86% to 90% to 93% against a 92% target. The diagnosis lists two causes: insufficient practice, and an unclear household definition. Training addresses only the first; the second needs another owner.
6. Select **Record history** on the brief to walk the sequence:
   1. The scenario failed in TRN-2.
   2. The dependency was recorded as Blocked.
   3. The job aid was approved.
   4. The dependency was Satisfied with evidence.
   5. The scenario passed.
   6. The exercise was validated and approved.
   7. Delivery entry was set to Proceed.
   8. Go/No-Go was set to Proceed.
   9. The materials were released.
   10. Observations and the diagnosis were recorded.

## Try it with editing on
Sign in to a workspace, or use a copy of the demo with editing enabled. Then:
1. Add a dependency.
2. Mark it Accepted exception without an approver. Saving is refused.
3. Change an evidence version. The linked scenario and deliverable are flagged for review, and their states do not change.

## What the demo does not claim
- No forecasts or confidence percentages are used in the brief. The earlier forecast panels sit under "Earlier overview panels" for reference.
- Gate completion is shown as "Gate completion (legacy)". It is the share of criteria marked met, not readiness.
