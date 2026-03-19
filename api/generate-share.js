import { randomUUID } from 'crypto';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authUser = await requireAuth(req, res);
  if (!authUser) return;

  const { analysisId } = req.body || {};
  if (!analysisId) return res.status(400).json({ error: 'Missing analysisId.' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
