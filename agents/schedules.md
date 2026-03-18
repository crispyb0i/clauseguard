# ClauseGuard Agent Schedule

All times are America/Los_Angeles.

## Daily (Weekdays)

| Time | Agent | Task | Slack Output |
|---|---|---|---|
| 8:30 AM | RevOps | Daily KPI digest | #cg-kpis |
| 9:00 AM | Customer Voice | Morning inbox triage | #cg-support |
| 10:00 AM | SDR | ICP research + lead scoring | #cg-growth (log only) |
| 11:30 AM | SDR | Send approved emails + follow-ups | #cg-growth |
| 1:00 PM | CTO | Engineering review + bug triage | #cg-alerts (P0/P1 only) |
| 3:00 PM | Customer Voice | Afternoon inbox triage | #cg-support |

## Weekly

| Day | Time | Agent | Task | Slack Output |
|---|---|---|---|---|
| Monday | 6:45 AM | CFO | Weekly financial brief | #cg-kpis |
| Monday | 8:00 AM | Chief of Staff | Monday operating brief | #cg-briefs |
| Monday | 2:00 PM | CMO | Strategy + content output | #cg-growth |
| Thursday | 2:30 PM | CTO | Launch-readiness review | #cg-alerts (if risks found) |
| Friday | 8:00 AM | RevOps | Weekly scorecard | #cg-kpis |
| Friday | 1:30 PM | Customer Voice | Feedback digest | #cg-support |
| Friday | 4:00 PM | Chief of Staff | Friday review memo | #cg-briefs |

## CMO Frequency Scaling

- **Weeks 1–4:** CMO runs once per week (Monday 2:00 PM only)
- **Week 5+:** CMO scales to Monday, Wednesday, Friday 2:00 PM once CTO and SDR can absorb the output volume

## SDR Prerequisites (Hard Gates)

SDR sends do NOT run until ALL of the following are confirmed:
- [ ] Dedicated outreach domain registered and DNS-configured (SPF/DKIM/DMARC)
- [ ] Outreach domain warmed (minimum 2 weeks)
- [ ] At least 3 approved email templates in `agents/templates/sdr-cold-email-approved.md`
- [ ] David has reviewed and approved the first lead batch (10 leads minimum)
- [ ] Daily send cap defined (start: 20/day, scale based on reply rate and deliverability)

## Event-Driven Triggers (No n8n — Agent-Pulled)

These are not separate automations. They are checked by the relevant agent during each scheduled run:

| Signal | Source | Checked By | Action |
|---|---|---|---|
| New inbound email | Gmail / hello@clauseguard.com | Customer Voice (9 AM + 3 PM) | Classify + route |
| Stripe cancellation/refund | Stripe | RevOps (8:30 AM) | Log + flag in #cg-alerts if churn threshold breached |
| Vercel deploy failure | Vercel | CTO (1:00 PM) | Create P1 Linear issue + post to #cg-alerts |
| Supabase incident | Supabase | CTO (1:00 PM) | Create P0 Linear issue + post to #cg-alerts |
| PostHog anomaly | PostHog | RevOps (8:30 AM) | Flag in digest + open investigation Linear task |
| #cg-inbox notes from David | Slack | All agents (start of each run) | Read before executing; adjust focus accordingly |

## Agent Run Start Protocol

Every agent must do the following at the start of each run:
1. Read #cg-inbox for any notes from David posted since the last run
2. Check Linear for any issues assigned to their queue
3. Check Notion Agent Memory for any context or decisions from other agents in the last 24h
4. Then execute the scheduled task
