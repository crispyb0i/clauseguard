export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/analyses?share_token=eq.${token}&select=filename,risk_score,risk_label,summary,result,created_at`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
  );

  if (!r.ok) return res.status(500).json({ error: 'Database error' });

  const rows = await r.json();
  if (!rows.length) return res.status(404).json({ error: 'Analysis not found or link expired' });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(rows[0]);
}
