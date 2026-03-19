import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authUser = await requireAuth(req, res);
  if (!authUser) return;
  const userId = authUser.id;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fetch user row
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=email,subscription_tier,analyses_used,analyses_reset_date,last_analysis_at`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
  );
  if (!userRes.ok) return res.status(500).json({ error: 'Failed to fetch user data.' });
  const users = await userRes.json();

  // Fetch all analyses
  const analysesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/analyses?user_id=eq.${userId}&select=id,filename,risk_score,risk_label,summary,result,created_at&order=created_at.desc`,
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
  );
  if (!analysesRes.ok) return res.status(500).json({ error: 'Failed to fetch analyses.' });
  const analyses = await analysesRes.json();

  const exportData = {
    exported_at: new Date().toISOString(),
    account: users[0] || { email: authUser.email },
    analyses,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="clauseguard-data-export.json"');
  return res.status(200).json(exportData);
}
