import { sendEmail, EMAILS } from './_email.js';

// Runs daily at 10am UTC (vercel.json cron schedule)
// Sends Day 2 tip email and Day 7 upgrade nudge to eligible free users
export default async function handler(req, res) {
  // Vercel cron sends GET; protect against external calls
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const now = new Date();

  // Fetch free users who've done at least one analysis
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/users?subscription_tier=eq.free&analyses_used=gte.1&select=id,email,created_at,analyses_used,onboarding_day2_sent,onboarding_day7_sent`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
  );
  const users = await r.json();
  if (!Array.isArray(users)) return res.status(500).json({ error: 'Failed to fetch users.' });

  let day2Sent = 0, day7Sent = 0;

  for (const user of users) {
    if (!user.email) continue;
    const created = new Date(user.created_at);
    const daysSince = (now - created) / (1000 * 60 * 60 * 24);

    // Day 2 tip
    if (daysSince >= 2 && !user.onboarding_day2_sent) {
      await sendEmail(EMAILS.tip(user.email)).catch(() => {});
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_day2_sent: true }),
      });
      day2Sent++;
    }

    // Day 7 upgrade nudge (only if still on free and used at least 1 analysis)
    if (daysSince >= 7 && !user.onboarding_day7_sent && user.analyses_used >= 1) {
      await sendEmail(EMAILS.upgrade(user.email, user.analyses_used, 3)).catch(() => {});
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_day7_sent: true }),
      });
      day7Sent++;
    }
  }

  return res.status(200).json({ ok: true, day2Sent, day7Sent });
}
