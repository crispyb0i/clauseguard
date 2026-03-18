# Playbook: Technical / Product Loop

**Owner:** CTO
**Trigger:** Weekdays 1:00 PM PT (daily review) + Thursday 2:30 PM PT (launch-readiness)
**Output:** Triaged Linear issues + Notion Agent Memory summary + #cg-alerts post (P0/P1 only)

---

## Step 1 — Read Context
- Read #cg-inbox for any technical redirections from David
- Check Linear for new issues tagged `bug`, `customer-feedback`, `launch-risk` since last CTO run
- Check Notion Customer Feedback Inbox for items with Type = `bug` or `feature-request` and Status = `Classified` (not yet actioned by CTO)

## Step 2 — Check Infrastructure

**Vercel:**
- Check latest deployment status
- Check for failed builds or edge function errors
- If deploy failure found: create Linear issue (label: `agent` + `launch-risk`, P1) → post to #cg-alerts

**Supabase:**
- Check auth error rate and recent incidents
- Check for storage or query anomalies
- If P0 incident: create Linear issue (P0) → post to #cg-alerts immediately

**PostHog:**
- Check onboarding funnel: signup → first analysis completion
- Note drop-off rate at each step
- If activation rate below 40%: create Linear issue with step-by-step friction analysis

## Step 3 — Triage New Bugs

For each new bug in the queue:
1. Confirm it is reproducible (check if another report exists, check error logs)
2. Assign severity:
   - **P0:** Product is down or core feature completely broken for all users
   - **P1:** Core feature broken for some users or significant data integrity risk
   - **P2:** Feature degraded but workaround exists
   - **P3:** Minor bug, cosmetic, or edge case
3. Write acceptance criteria: "This issue is resolved when [specific, testable condition]"
4. Update Linear issue with severity, acceptance criteria, and any reproduction steps

## Step 4 — Review Customer Feedback for Product Signals

For each `customer-feedback` issue in the CTO queue:
- Determine if it reveals a product gap, friction point, or architectural concern
- If actionable: create a new Linear engineering issue with acceptance criteria
- If informational only: comment on the issue and close it with a note for CMO or RevOps

## Step 5 — Prioritize Engineering Queue

Review all open P0–P3 issues and confirm:
- P0s have someone working on them (or flag to David that manual intervention is needed)
- P1s are in "In Progress" or have a clear next step
- P2/P3 backlog is ordered by user impact
- No issue has been stuck in "In Progress" for more than 5 days without a status update

## Step 6 — Post Daily Summary

Post to Notion Agent Memory (Type: Digest, Agent: CTO). Post to #cg-alerts only if P0/P1 found.

Use the format defined in `agents/roles/cto.md`.

---

## Thursday Launch-Readiness Review (Additional Steps)

## Step 7 — Review All Open Launch-Risk Issues
- List every open Linear issue tagged `launch-risk`
- Assign an overall status: GREEN (no blockers), YELLOW (risks but shippable), RED (blockers present)

## Step 8 — Check Core User Flow
Mentally trace the critical path: landing page → signup → first analysis → result → upgrade prompt.
Flag any step with a known bug, missing state, or unhandled error.

## Step 9 — Post Launch-Readiness Summary
Post to #cg-alerts if YELLOW or RED. Save to Notion Agent Memory.
Use the format defined in `agents/roles/cto.md`.
