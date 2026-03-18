# Playbook: Customer Feedback Intake

**Owner:** Customer Voice
**Trigger:** Scheduled triage run (9:00 AM and 3:00 PM weekdays)
**Output:** Notion record + Linear issue (if actionable) + reply or draft

---

## Step 1 — Read #cg-inbox
Check for any instructions from David about how to handle specific emails or categories.

## Step 2 — Scan Gmail
Open hello@clauseguard.com and identify all unread/unprocessed emails since the last triage run.

## Step 3 — Classify Each Email

For each email, determine the single best classification:

| Signal | Classification |
|---|---|
| Something is broken or not working | bug |
| Request for a new feature or capability | feature-request |
| Concern about price, trust, complexity, or value | objection |
| Question about how to use the product | support |
| Expression of satisfaction or delight | praise |
| Question about charges, plans, or refunds | billing |
| Signal of intent to cancel or disengagement | churn-risk |
| Specific quotable praise | testimonial-candidate |

When in doubt between two types, choose the one that requires more urgent action.

## Step 4 — Write to Notion Customer Feedback Inbox

For every email, create a record:
- Subject: email subject line
- Type: classification from Step 3
- Status: New → Classified
- From: sender email
- Summary: 2–3 sentence summary of what the person said and what they need
- Date Received: date of email

## Step 5 — Route and Act

**If bug:**
- Create Linear issue: title = short bug description, labels = `bug` + `customer-feedback` + `agent`, severity = P1 or P2 based on impact
- Assign to CTO queue
- Update Notion record: Linear Issue URL, Routed To = CTO, Status = Actioned

**If feature-request:**
- Create Linear issue: labels = `Feature` + `customer-feedback` + `agent`
- Update Notion record: Routed To = CTO, Status = Actioned

**If objection:**
- Add to Notion Objection Library: Objection = core concern, Category = pricing/trust/complexity/timing/competitor/value, Frequency += 1 (or create new)
- Create Linear issue: labels = `sales-objection` + `customer-feedback` + `agent`, route to CMO queue
- Update Notion record: Routed To = CMO, Status = Actioned

**If support:**
- Check `agents/templates/customer-voice-reply-approved.md` for a matching template
- If match found: send reply from hello@clauseguard.com using the template; update Notion record: Reply Sent = ✓
- If no match: draft a reply, post to #cg-support tagged "Needs Your Reply — [Subject]"; do NOT send
- Update Notion record: Routed To = David (if draft) or No Action (if sent), Status = Actioned

**If praise:**
- Check if it is specific and quotable → if yes, also classify as testimonial-candidate
- No Linear issue needed
- Update Notion record: Routed To = No Action, Status = Closed

**If billing:**
- Notify RevOps by creating a Linear issue: labels = `billing` + `customer-feedback` + `agent`
- If urgent (refund request, active complaint): also post to #cg-alerts
- Update Notion record: Routed To = RevOps, Status = Actioned

**If churn-risk:**
- Immediately post to #cg-alerts: `[⚠️ Churn Risk] — [sender] — [brief summary]`
- Create Linear issue: labels = `billing` + `customer-feedback` + `agent`, P1
- Notify RevOps
- Update Notion record: Routed To = David, Status = Actioned

**If testimonial-candidate:**
- Create record in Notion Testimonials: Name = sender name, Quote = the quotable text, Status = Candidate
- No Linear issue
- Update Notion record: Routed To = No Action, Status = Closed

## Step 6 — Post Triage Summary to #cg-support

Use the format defined in `agents/roles/customer-voice.md`.

## Step 7 — Save to Notion Agent Memory

Save a brief summary of the run (Type: Digest, Agent: Customer Voice) for Chief of Staff to reference.
