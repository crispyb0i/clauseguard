import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = authHeader.slice(7);

  const { analysisId } = req.body || {};
  if (!analysisId) return res.status(400).json({ error: 'Missing analysisId.' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Verify JWT and get user ID
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
  });
  if (!authRes.ok) return res.status(401).json({ error: 'Session expired. Please log in again.' });
  const authUser = await authRes.json();

  const newToken = randomUUID();

  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/analyses?id=eq.${encodeURIComponent(analysisId)}&user_id=eq.${authUser.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ share_token: newToken }),
    }
  );

  if (!patchRes.ok) {
    return res.status(500).json({ error: 'Failed to generate share link.' });
  }

  return res.status(200).json({ shareToken: newToken });
}
