# Playbook: Financial Overview Loop (CFO)

## Trigger
Monday 6:45 AM scheduled run.

## Steps

### 1. Read Notion Expenses database
- Fetch all rows from https://www.notion.so/3275258e55708103a7d2c214b9666e84
- Sum all rows where Status = "Active" or "Trial" using the Monthly Cost column
- Note any rows with Status = "Trial" and flag upcoming trial-to-paid conversions

### 2. Pull Stripe revenue data
- Fetch active subscriptions — count by plan tier (Starter/Pro/Team)
- Calculate MRR: sum of all active subscription amounts
- Fetch last 7 days of charges — note any new subscribers or churned customers
- Check for open disputes or past-due invoices
- Apply transaction fee estimate: subtract 2.9% + $0.30 per charge for effective revenue

### 3. Read Notion Agent Memory for last week's brief
- Find previous CFO brief entry
- Extract prior MRR and burn rate for week-over-week comparison

### 4. Calculate net position
- Net profit/loss = MRR (after fees) minus total monthly burn
- Break-even gap = $208.92 (current burn) minus MRR — if negative, break-even achieved
- Note any changes from prior week

### 5. Check anomaly thresholds
- MRR drop > 20% WoW → flag in brief
- New Stripe charges not in Notion Expenses → flag in brief
- Active disputes → escalate to #cg-alerts immediately
- Past-due subscriptions > 3 days → flag in brief

### 6. Post to #cg-kpis
- Use the Weekly Brief Format from agents/roles/cfo.md
- Always end with @david mention
- Keep it factual — no speculation or projections unless clearly labeled as estimates

### 7. Save to Notion Agent Memory
- Save a record: date, MRR, burn rate, net position, any flags
- This enables week-over-week comparison on next run
