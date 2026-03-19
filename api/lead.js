import { sendEmail, EMAILS } from './_email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: JSON.stringify({ email, source: 'exit_intent', created_at: new Date().toISOString() }),
  });

  if (!r.ok && r.status !== 409) {
    return res.status(500).json({ error: 'Failed to save email.' });
  }

  sendEmail(EMAILS.checklist(email)).catch((err) => {
    console.error('sendEmail failed:', err);
  });

  return res.status(200).json({ ok: true });
}
