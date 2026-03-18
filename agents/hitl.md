# Human-in-the-Loop Checkpoints

These are actions that require David's explicit review or approval before execution. No agent may take these actions autonomously.

## Always Requires David's Approval

| Action | Agent | How to Request Approval |
|---|---|---|
| Sending any cold email to a prospect | SDR | Post lead batch to #cg-growth with "Awaiting Approval" tag |
| Using a new email template not yet in `agents/templates/` | SDR or Customer Voice | Post draft template to #cg-growth or #cg-support |
| Adding a new email template to the approved templates file | Any | Post to #cg-growth for review |
| Locking weekly priorities in Linear | Chief of Staff | Post Monday brief to #cg-briefs; wait for ✅ before locking |
| Any action that changes pricing | Any | Escalate to David immediately; no autonomous action |
| Any action that changes public-facing positioning or copy | CMO | Post hypothesis to #cg-growth; requires David sign-off before implementation |
| Running a database migration | CTO | Write migration script to Notion Agent Memory; David executes manually |
| Triggering a production deployment | CTO | Create Linear issue with deploy instructions; David or CI/CD executes |
| Sending a non-templated support reply | Customer Voice | Post draft to #cg-support tagged "Needs Your Reply" |
| Launching any paid advertising or sponsored content | CMO | Escalate to David; never autonomous |
| Refunding a customer | Any | Escalate to David via #cg-alerts |

## Review Before First Use (One-Time Gates)

| Gate | Agent | Status |
|---|---|---|
| First lead batch (10+ leads) reviewed by David | SDR | ⬜ Pending |
| Dedicated outreach domain registered with SPF/DKIM/DMARC | SDR | ✅ Cleared 2026-03-18 (getclauseguard.io — registered on Namecheap, added to Google Workspace, SPF/DKIM/DMARC configured) |
| Outreach domain warmed (minimum 2 weeks) | SDR | ⬜ In progress — warming started 2026-03-18, sends unblocked ~2026-04-01. Week 1: 5/day to warm contacts. Week 2: 10/day. Full cap (20/day) from April 1. |
| At least 3 approved cold email templates in place | SDR | ✅ Cleared 2026-03-18 (Templates 1, 2, and 3 approved — Template 3: "Lost IP" Hook for designers & developers) |
| SDR cold email templates approved by David | SDR | ✅ Cleared 2026-03-18 |
| Customer Voice reply templates approved by David | Customer Voice | ✅ Cleared 2026-03-18 |
| Monday brief format reviewed and acknowledged by David | Chief of Staff | ⬜ Pending |

Update this file and check the boxes as gates are cleared.

## Escalation Protocol

When an agent encounters something that requires David's input and it is not covered above:

1. Do not proceed with the action
2. Post to the relevant Slack channel with a clear subject: `[NEEDS DECISION] — description`
3. Create a Linear issue tagged with the relevant label and assign to David's queue
4. Save context to Notion Agent Memory so the next agent run can resume from where it stopped
5. Note the blocked item in the next Chief of Staff brief

## What Agents Can Do Without Approval

- Create, update, and close Linear issues
- Write to any Notion database
- Read from any connected service (Stripe, PostHog, Vercel, Supabase, Gmail)
- Post to any Slack channel
- Research leads (without sending)
- Draft emails and templates (without sending)
- Classify and route feedback
- Generate analysis, reports, and recommendations
