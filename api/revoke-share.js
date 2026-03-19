import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  const { token: shareToken } = req.body || {};
  if (!shareToken) return res.status(400).json({ error: 'Missing token.' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Null out share_token only for rows belonging to this user
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/analyses?share_token=eq.${encodeURIComponent(shareToken)}&user_id=eq.${authUser.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ share_token: null }),
    }
  );

  if (!patchRes.ok) {
    return res.status(500).json({ error: 'Failed to revoke link.' });
  }

  return res.status(200).json({ ok: true });
}
