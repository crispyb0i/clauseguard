# ClauseGuard Agent OS

## Overview

This folder is the versioned operating context for the ClauseGuard autonomous agent system. It contains role charters, playbooks, prompts, schedules, KPI definitions, integration rules, and HITL checkpoints.

**Operational state lives in Linear and Notion — not here.** This folder is for prompts, charters, and operating rules only.

## Tool Stack

| Tool | Purpose |
|---|---|
| Linear | All actionable work, issues, priorities, bugs, experiments |
| Notion | Memory, research, feedback, objections, testimonials, briefs |
| Slack | Agent-to-David communication and async notes |
| Gmail | Customer support and SDR outreach — both via hello@clauseguard.io (existing Google Workspace) |
| Stripe | Revenue, churn, and subscription signals |
| PostHog | Activation, funnel, retention, and behavior data |
| Vercel | Deploy and production health |
| Supabase | Data integrity, auth, and storage incidents |
| Context7 | Library/API documentation (CTO only) |

## Slack Channels

| Channel | ID | Owner | Purpose |
|---|---|---|---|
| #cg-briefs | C0AME2K12MQ | Chief of Staff | Monday briefs, Friday reviews |
| #cg-kpis | C0AME2L9C10 | RevOps | Daily digests, weekly scorecards |
| #cg-alerts | C0AME2Q3XFC | All agents | P0/P1 only |
| #cg-growth | C0AN8AQRBMW | CMO + SDR | Strategy outputs, campaign logs |
| #cg-support | C0ALYK2F5ST | Customer Voice | Feedback digests, reply drafts |
| #cg-inbox | C0AMAL1BWSZ | David → agents | Async redirections from David |

## Notion Databases

| Database | URL |
|---|---|
| Agent Memory | https://www.notion.so/aec01417e58b497e9c2938708c6b17fd |
| Customer Feedback Inbox | https://www.notion.so/71ec71e96a7042bc9b9762e28dc0891b |
| Objection Library | https://www.notion.so/457f9e274f0941b1b9b064a5d9247da9 |
| Testimonials | https://www.notion.so/71a49cf576fd4234a17a9fbc2eedfd45 |
| Campaign Archive | https://www.notion.so/601ca208645541ed8e4db018b1029b8f |
| Weekly Briefs | https://www.notion.so/c62e09132c074b49ab96059c7328ac94 |

## Linear

- **Team:** Clauseguard (ID: 710775a2-d781-47b3-a8eb-93ad0901f2a6)
- **Labels:** customer-feedback, support, sales-objection, testimonial-candidate, billing, launch-risk, content, outbound, agent-failure, Bug, Feature, Improvement, agent, experiment, growth, website
- **Statuses:** Todo, In Progress, Backlog, Done, Canceled

## Agent Roster

1. **Chief of Staff** — Weekly priorities, coordination, escalation, KPI review
2. **CTO** — App quality, technical backlog, launch readiness, bug triage
3. **CMO** — Messaging, positioning, content strategy, growth experiments
4. **SDR** — Prospecting, outreach execution, follow-up state
5. **Customer Voice** — Inbox triage, feedback classification, support routing
6. **RevOps** — KPI reporting, anomaly detection, revenue snapshots
7. **CFO** — Weekly financial brief, burn rate tracking, Stripe revenue monitoring

## Escalation Rules

- **P0** (critical/down): Post to #cg-alerts immediately. Chief of Staff notified in Linear description.
- **P1** (major/urgent): Post to #cg-alerts. Assign to relevant agent queue.
- **P2** (moderate): Create Linear issue, assign to agent queue, no Slack alert needed.
- **P3** (minor): Create Linear issue only.
- **Agent failure**: Create Linear issue tagged `agent-failure`. Chief of Staff reviews Monday.

## Human-in-the-Loop Checkpoints

See `agents/hitl.md` for the full list of actions requiring David's review before execution.

## Known Infrastructure Constraints

- **Cowork must be open and running** for scheduled tasks to fire. Tasks are local to the machine, not server-side — they queue and run on next app launch if Cowork was closed. Workaround: keep laptop open and plugged in with display sleep allowed, or leave a dedicated machine running Cowork.
- **Sending domain:** hello@clauseguard.io (Google Workspace). No separate outreach domain. Keep daily SDR send volume low (<20/day) to protect domain reputation.

## System Status (last updated 2026-03-18)

| Agent | Scheduled Tasks | Status |
|---|---|---|
| CFO | cfo-weekly-brief (Mon 6:45AM) | ✅ Live |
| Chief of Staff | chief-of-staff-monday-brief (Mon 8AM), chief-of-staff-friday-review (Fri 4PM) | ✅ Live |
| RevOps | revops-daily-digest (daily 7AM), revops-weekly-scorecard (Mon 7:30AM) | ✅ Live |
| Customer Voice | customer-voice-triage (daily 8:30AM) | ✅ Live |
| CTO | cto-launch-readiness (Thu 10AM) | ✅ Live — daily 1PM task may be missing, verify |
| CMO | cmo-strategy (Mon 2PM weeks 1-4, then Mon/Wed/Fri) | ✅ Live |
| SDR | sdr-research (weekdays 10AM), sdr-sends (weekdays 11:30AM) | ✅ Live — gated pending first lead batch review |

## Folder Structure

```
agents/
├── README.md               ← this file
├── schedules.md            ← source-of-truth schedule table
├── kpis.md                 ← KPI definitions and anomaly thresholds
├── integrations.md         ← canonical tool usage rules per agent
├── hitl.md                 ← actions requiring human approval
├── roles/                  ← one charter per agent
├── playbooks/              ← step-by-step procedures for core workflows
├── prompts/                ← instantiation prompts for each agent role
└── templates/              ← approved SDR and Customer Voice reply templates
```
