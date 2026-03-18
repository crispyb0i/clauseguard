# ClauseGuard Integration Rules

Canonical usage rules for every tool in the system. Agents must follow these exactly.

## Linear

- **Team:** Clauseguard (ID: 710775a2-d781-47b3-a8eb-93ad0901f2a6)
- **All agents** can create and update issues
- Every issue must have: a title, at least one label, a severity (P0–P3 in the description), and the creating agent named in the description
- Issues are never deleted — use "Canceled" status instead
- Agent-created issues must include the label `agent` in addition to their domain label

**Label → Routing:**
| Label | Routes To |
|---|---|
| customer-feedback | CTO queue (if product issue) or CMO queue (if messaging) |
| bug | CTO queue |
| support | Customer Voice queue |
| sales-objection | CMO queue |
| testimonial-candidate | No Linear issue needed — Notion Testimonials only |
| billing | RevOps queue |
| launch-risk | CTO queue |
| content | CMO queue |
| outbound | SDR queue |
| agent-failure | Chief of Staff queue |

## Notion

- **Agent OS parent page:** https://www.notion.so/3275258e557081efba36cbd8b94839c9

**Database URLs:**
| Database | URL |
|---|---|
| Agent Memory | https://www.notion.so/aec01417e58b497e9c2938708c6b17fd |
| Customer Feedback Inbox | https://www.notion.so/71ec71e96a7042bc9b9762e28dc0891b |
| Objection Library | https://www.notion.so/457f9e274f0941b1b9b064a5d9247da9 |
| Testimonials | https://www.notion.so/71a49cf576fd4234a17a9fbc2eedfd45 |
| Campaign Archive | https://www.notion.so/601ca208645541ed8e4db018b1029b8f |
| Weekly Briefs | https://www.notion.so/c62e09132c074b49ab96059c7328ac94 |

- Every agent saves a summary of each run to **Agent Memory** (Type: Digest or Brief)
- Customer Voice writes every classified email to **Customer Feedback Inbox**
- Customer Voice writes every objection to **Objection Library**
- Customer Voice writes every testimonial candidate to **Testimonials**
- SDR writes every campaign to **Campaign Archive** before sending
- Chief of Staff and RevOps write every brief/scorecard to **Weekly Briefs**

## Gmail

- **Support inbox:** hello@clauseguard.com — Customer Voice only
- **Outreach domain:** separate domain (TBD — must be configured before SDR sends) — SDR only
- Customer Voice may ONLY send replies using approved templates from `agents/templates/customer-voice-reply-approved.md`
- Non-templated replies must be drafted and posted to #cg-support for David to send manually
- SDR may ONLY use the outreach domain — never hello@clauseguard.com
- SDR may ONLY send emails using approved templates from `agents/templates/sdr-cold-email-approved.md`

## Slack

- **David's user ID:** U09PT0M8MGW
- All agents read #cg-inbox (C0AMAL1BWSZ) at the start of every run
- Agent output goes to the channel assigned to that agent (see README.md)
- #cg-alerts (C0AME2Q3XFC) is for P0/P1 only — do not post routine output there
- Message format for all agent posts: `[Agent Name · Task Type] — body`

## Stripe

- **RevOps only** — no other agent queries Stripe directly
- RevOps checks for: new subscriptions, cancellations, refunds, failed payments, disputes
- Stripe signals feed into RevOps daily digest and anomaly detection

## PostHog

- **RevOps** (primary): activation rates, funnel metrics, retention, KPI tracking
- **CTO** (read-only): friction signals, onboarding drop-offs, error events
- **CMO** (read-only): conversion funnel data to inform messaging decisions
- No agent creates PostHog events — read-only access only

## Vercel

- **CTO only**
- Checks deploy status during 1:00 PM daily run
- Deploy failures create a P1 Linear issue and a #cg-alerts post

## Supabase

- **CTO only**
- Checks for auth errors and data incidents during 1:00 PM daily run
- Incidents create a P0 Linear issue and a #cg-alerts post
- CTO may NOT run migrations autonomously — migration scripts require David's execution

## Context7

- **CTO only**
- Used exclusively for looking up library/API documentation during technical triage
- Not used for business intelligence, market research, or any non-technical purpose
