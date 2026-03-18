# ClauseGuard KPI Definitions and Anomaly Thresholds

All agents use these definitions. Do not invent alternative metrics.

## Core KPIs

| KPI | Definition | Source |
|---|---|---|
| Signup | New account created in Supabase auth | PostHog / Supabase |
| Activated User | User who completed their first contract analysis | PostHog event: `analysis_completed` |
| First Analysis Completed | The specific event of a user running their first analysis | PostHog |
| Free-to-Paid Conversion | User who upgraded from free/trial to any paid plan | Stripe |
| Reply Rate | (Replies received / emails sent) × 100 — rolling 7-day window | Campaign Archive (Notion) |
| Positive Reply Rate | (Positive replies / total replies) × 100 | Campaign Archive (Notion) |
| Churn Event | Subscription cancelled, expired, or payment failed without recovery | Stripe |
| Customer-Reported Bug | Bug classified by Customer Voice from hello@clauseguard.com | Customer Feedback Inbox (Notion) |
| Testimonial Candidate | Praise email identified and captured by Customer Voice | Testimonials (Notion) |

## Anomaly Thresholds

These trigger a Linear investigation task AND a post to #cg-alerts when breached:

| KPI | Threshold | Action |
|---|---|---|
| Signups | Drop >30% week-over-week | RevOps opens investigation task |
| Activation Rate | Falls below 40% (signups who activated / total signups) | RevOps flags; CTO investigates onboarding friction |
| First Analysis Completed | Drop >25% week-over-week | CTO investigates product issue |
| Free-to-Paid Conversion | Falls below 10% of signups in any 7-day window | CMO investigates messaging; RevOps flags |
| Reply Rate (outbound) | Falls below 5% over 7-day rolling window | SDR pauses sends; CMO reviews templates |
| Positive Reply Rate | Falls below 20% of all replies | CMO reviews objection library |
| Churn Events | More than 2 in a single week | RevOps flags immediately; Chief of Staff notified |
| Customer-Reported Bugs | More than 3 distinct bugs in a single week | CTO escalates to P1 queue review |

## Reporting Cadence

- **RevOps daily digest** (weekdays 8:30 AM → #cg-kpis): signups, activation rate, conversions, churn events since yesterday, campaign metrics
- **RevOps weekly scorecard** (Friday 8:00 AM → #cg-kpis): full week summary with week-over-week deltas, anomaly flags, and recommendations
- **Chief of Staff Friday review** (Friday 4:00 PM → #cg-briefs): references RevOps scorecard, CTO launch status, CMO experiment results, Customer Voice feedback summary

## KPI History

RevOps saves each weekly scorecard to the Notion Weekly Briefs database for longitudinal tracking. Linear investigation tasks link back to the scorecard that triggered them.

## Starting Baselines

Until enough data exists to compute week-over-week deltas, RevOps reports actuals only and notes "insufficient baseline — tracking." Thresholds activate after 3 full weeks of data.
