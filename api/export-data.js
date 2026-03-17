export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = authHeader.slice(7);

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Verify JWT and get user profile
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
  });
  if (!authRes.ok) return res.status(401).json({ error: 'Session expired. Please log in again.' });
  const authUser = await authRes.json();
  const userId = authUser.id;

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
