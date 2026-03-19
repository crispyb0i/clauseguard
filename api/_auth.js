const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Verifies the Bearer JWT against Supabase and returns { id, email }.
 * Sends a 401 and returns null if auth fails — caller should `return` immediately.
 */
export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const token = authHeader.slice(7);

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
  });

  if (!authRes.ok) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
    return null;
  }

  const { id, email } = await authRes.json();
  return { id, email };
}
