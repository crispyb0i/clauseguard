import { sendEmail, EMAILS } from './_email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = authHeader.slice(7);

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Verify JWT
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });
  if (!authRes.ok) {
    return res.status(401).json({ error: 'Session expired.' });
  }
  const authUser = await authRes.json();
  const userId = authUser.id;

  const { ref } = req.body ?? {};
  if (!ref || typeof ref !== 'string' || ref.length > 20) {
    return res.status(400).json({ error: 'Invalid referral code.' });
  }

  // Load current user record
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=id,referred_by,bonus_analyses`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  const userRows = await userRes.json();

  if (!Array.isArray(userRows) || userRows.length === 0) {
    return res.status(404).json({ error: 'User record not found. Please run an analysis first.' });
  }

  const currentUser = userRows[0];

  // Already referred — prevent double activation
  if (currentUser.referred_by) {
    return res.status(200).json({ ok: true, skipped: 'already_referred' });
  }

  // Look up referrer by referral_code
  const referrerRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?referral_code=eq.${encodeURIComponent(ref)}&select=id,email,referral_count,bonus_analyses`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  const referrerRows = await referrerRes.json();

  if (!Array.isArray(referrerRows) || referrerRows.length === 0) {
    return res.status(400).json({ error: 'Referral code not found.' });
  }

  const referrer = referrerRows[0];

  // Prevent self-referral
  if (referrer.id === userId) {
    return res.status(400).json({ error: 'You cannot refer yourself.' });
  }

  // Update referred user: set referred_by and add 3 bonus analyses
  await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      referred_by: ref,
      bonus_analyses: (currentUser.bonus_analyses ?? 0) + 3,
    }),
  });

  // Update referrer: increment referral_count and add 3 bonus analyses
  await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${referrer.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      referral_count: (referrer.referral_count ?? 0) + 1,
      bonus_analyses: (referrer.bonus_analyses ?? 0) + 3,
    }),
  });

  // Notify referrer by email
  if (referrer.email && authUser.email) {
    sendEmail(EMAILS.referralNotify(referrer.email, authUser.email)).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
