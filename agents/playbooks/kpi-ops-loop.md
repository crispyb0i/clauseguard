# Playbook: KPI / Ops Loop

**Owner:** RevOps
**Trigger:** Weekdays 8:30 AM PT (daily digest) + Friday 8:00 AM PT (weekly scorecard)
**Output:** Notion digest + #cg-kpis post + Linear investigation task (if anomaly)

---

## Step 1 — Read Context
- Read #cg-inbox for any reporting redirections from David
- Check Notion Agent Memory for anomalies flagged in the previous RevOps run

## Step 2 — Pull Stripe Data

Query Stripe for the period since the last run:
- New subscriptions created
- Cancellations / churned subscriptions
- Refunds issued
- Failed payment attempts
- Active disputes

Compare churn count against threshold (>2 in a single week = anomaly).

## Step 3 — Pull PostHog Data

Query PostHog for:
- New signups (last 24h and 7-day rolling)
- Activation rate: users who completed `analysis_completed` event / total signups (7-day)
- Free-to-paid conversion rate: Stripe conversions / PostHog signups (7-day)
- Onboarding funnel step drop-offs (for CTO reference)

Compare activation rate against threshold (<40% = anomaly).
Compare conversion rate against threshold (<10% = anomaly).

## Step 4 — Pull Campaign Archive Data

Query Notion Campaign Archive for the current week's campaigns:
- Total sends
- Total replies
- Positive replies
- Calculate reply rate and positive reply rate

Compare reply rate against threshold (<5% over 7-day rolling = anomaly).

## Step 5 — Check Anomaly Thresholds

For each KPI, compare against thresholds in `agents/kpis.md`. For each breach:
1. Create a Linear investigation task: title = "Anomaly: [KPI name] — [DATE]", label = relevant domain label + `agent`, P1
2. Post to #cg-alerts: `[⚠️ ANOMALY] [KPI]: [value] — below threshold of [threshold] — Linear: [link]`
3. Note in the daily digest

## Step 6 — Compute MRR

Calculate current MRR from active Stripe subscriptions:
- Starter ($29/mo) × active Starter subscriptions
- Pro ($59/mo) × active Pro subscriptions
- Team ($99/mo) × active Team subscriptions
- Total MRR = sum

## Step 7 — Write Daily Digest

Post to #cg-kpis. Save to Notion Agent Memory.
Use the format defined in `agents/roles/revops.md`.

---

## Friday Weekly Scorecard (Additional Steps)

## Step 8 — Compute Week-over-Week Deltas

Compare this week's numbers to last week's from Notion Agent Memory (last Friday's digest or scorecard).

## Step 9 — Compile Product Health Section

Pull from CTO's Notion Agent Memory entries this week:
- Count of customer-reported bugs
- Open P0/P1 issues from Linear

## Step 10 — Write Observations

One or two sentences on the most interesting pattern in this week's data. Examples:
- "Activation rate improved 8pp WoW — likely driven by the onboarding copy change deployed Tuesday"
- "Reply rate held steady despite increased send volume — current templates are performing"
- "2 churn events this week from users who signed up 6+ days ago but never completed an analysis — activation is the primary risk"

## Step 11 — Save to Notion Weekly Briefs

Create a new record in the Notion Weekly Briefs database:
- Title: Weekly Scorecard — Week of [DATE]
- Agent: RevOps
- Type: Weekly Scorecard
- Week Of: [Monday of the current week]
- Summary: the full scorecard text

Post to #cg-kpis.
