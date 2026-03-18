# Playbook: Growth / Content Loop

**Owner:** CMO
**Trigger:** Monday 2:00 PM PT (weeks 1–4); Monday, Wednesday, Friday 2:00 PM PT (week 5+)
**Output:** One strategic output (messaging / landing page / content / outbound angle) + Linear issue if execution needed

---

## Step 1 — Read Context
- Read #cg-inbox for any strategic redirections from David
- Read Notion Objection Library: new objections added since last CMO run
- Read Notion Customer Feedback Inbox: entries classified as `objection` or `praise` since last run
- Read Notion Campaign Archive: reply rates, positive reply rates, recent objections from outbound
- Check PostHog: free-to-paid conversion funnel, onboarding step drop-offs
- Read Notion Testimonials: newly approved testimonials

## Step 2 — Identify the Highest-Leverage Signal

Look for the most actionable signal across all sources. Prioritise signals in this order:
1. Churn signals or sudden conversion drop (urgent — address immediately)
2. Repeated objection (seen 2+ times in the Objection Library without "Addressed in Messaging" checked)
3. Outbound reply rate below 5% (template or angle needs fixing)
4. Onboarding drop-off above 60% at any single step (CTO + CMO both need to act)
5. No testimonials captured in 2+ weeks (prioritise a testimonial-mining content angle)
6. Opportunity signal (testimonial usable in copy, strong positive reply pattern worth amplifying)

## Step 3 — Choose One Output Type

Select the output type that best addresses the highest-leverage signal:

**Messaging Refinement** — use when an objection is not addressed in current copy, or conversion is dropping.
- Identify the specific page, headline, or value prop to change
- Write the proposed new copy
- Note the hypothesis and success metric
- Create a Linear issue: `growth-experiment`, P2, with the proposed copy change as the description

**Landing Page Hypothesis** — use when funnel data shows a specific drop-off or untested opportunity.
- Define the specific element to test (headline, CTA, social proof section, pricing framing)
- Write the variant copy
- Define the success metric (e.g., "trial signup rate improves from X% to Y%")
- Create a Linear issue: `growth-experiment`, P2

**Content Asset** — use when there is an unanswered objection that content could address, or a testimonial angle worth amplifying.
- Define the format (tweet thread, blog post, case study, comparison post)
- Write the brief: audience, hook, key points, CTA
- Create a Linear issue: `content`, P3

**Outbound Angle** — use when reply rates are declining or SDR needs a fresh hook.
- Define the new angle: what pain point, what hook, what ICP sub-segment
- Write the subject line and first 2 sentences
- Define which approved template to update or note that a new template needs David's approval
- Post to #cg-growth so SDR can incorporate on the next run

## Step 4 — Write and Post Output

Post to #cg-growth using the format defined in `agents/roles/cmo.md`.

## Step 5 — Save to Notion Agent Memory

Save the full rationale, signal source, and output to Notion Agent Memory (Type: Decision, Agent: CMO).

## Step 6 — Update Objection Library

If the output addresses a known objection, check "Addressed in Messaging" in the Notion Objection Library record.
