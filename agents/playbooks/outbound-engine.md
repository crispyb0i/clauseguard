# Playbook: Outbound Engine

**Owner:** SDR
**Trigger:** Scheduled weekday runs (10:00 AM research, 11:30 AM sends)
**Output:** Researched leads in Notion Campaign Archive + sent emails logged

---

## Prerequisites Check (Run Before Every Session)

Before doing anything else, verify all hard gates are met (see `agents/hitl.md`). If any gate is unmet, do research only — no sends.

- [ ] Outreach domain confirmed live with SPF/DKIM/DMARC
- [ ] Domain warmed (2+ weeks)
- [ ] Approved templates exist in `agents/templates/sdr-cold-email-approved.md`
- [ ] First lead batch approved by David
- [ ] Daily send cap confirmed

---

## Research Run (10:00 AM)

### Step 1 — Read Context
- Read #cg-inbox for any targeting redirections
- Read Notion Campaign Archive for active campaigns and follow-up queue
- Read latest CMO output in Notion Agent Memory for current outbound angle

### Step 2 — Source Leads
Research freelancers who match the ICP definition in `agents/roles/sdr.md`:
- Use web research: Contra, Toptal, Upwork profiles, personal portfolios, LinkedIn
- Look for: designers, developers, copywriters, consultants, photographers, marketers with active client work

### Step 3 — Score Each Lead (1–10)
Score based on:
- **ICP fit** (does their work clearly involve client contracts?): 0–4 points
- **Online presence / credibility** (active portfolio, public work history): 0–3 points
- **Likely contract volume** (appears to have multiple clients, not just employed): 0–3 points

Skip any lead below 6/10. Do not send to low-confidence leads.

### Step 4 — Log to Notion Campaign Archive
For each qualified lead:
- Campaign Name: [Lead Name] — [Date]
- Type: cold-email
- Status: Awaiting Approval (first batch) or approved (ongoing)
- ICP Segment: freelancer-[type]
- Template Used: [template name from approved list]
- Notes: personalization detail (what makes this person a good fit)

### Step 5 — Post Research Summary to #cg-growth

```
[SDR · Research] — [DATE]
Leads researched: [n] | Qualified: [n] | Skipped (low confidence): [n]
Ready to send: [n] | Awaiting first-batch approval: [n]
Angle used: [CMO angle reference]
```

---

## Send Run (11:30 AM)

### Step 1 — Check Send Queue
Pull leads from Notion Campaign Archive with Status = Approved (or status confirmed by David for first batch).

### Step 2 — Personalize Each Email
For each lead:
1. Open the approved template from `agents/templates/sdr-cold-email-approved.md`
2. Fill in: first name, specific detail about their work (from research), relevant pain point
3. Do not add claims not in the template
4. Do not use legal-advice language

### Step 3 — Send
- Send from outreach domain only
- One email per lead per sequence step
- Respect daily send cap

### Step 4 — Update Notion Campaign Archive
- Status: Active
- Date sent: today
- Follow-up due: +5 business days

### Step 5 — Log Follow-Ups
For leads where the follow-up date has passed and no reply:
- Send follow-up email (use approved follow-up template)
- Update Campaign Archive: follow-up sent date

For leads with replies:
- Log reply type: positive / neutral / objection / unsubscribe
- If positive: flag in #cg-growth for David's awareness
- If objection: add to Notion Objection Library with source = outbound
- If unsubscribe: mark lead as Closed, never contact again

### Step 6 — Post Send Summary to #cg-growth

```
[SDR · Sends] — [DATE]
Sent: [n] | Follow-ups: [n] | Domain: [domain]
Replies received since last run: [n] | Positive: [n] | Objections: [n]
Cumulative active leads: [n]
```
