import { Sentry } from './_sentry.js';

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
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Verify JWT
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY },
  });
  if (!authRes.ok) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const authUser = await authRes.json();
  const userId = authUser.id;
  const email = authUser.email;

  try {
    // 1. Cancel active Stripe subscription if any
    if (STRIPE_SECRET_KEY && email) {
      const searchRes = await fetch(
        `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
        { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
      );
      if (!searchRes.ok) {
        throw new Error(`Stripe customer lookup failed: ${searchRes.status}`);
      }
      const searchData = await searchRes.json();
      const customer = searchData.data?.[0];
      if (customer) {
        const subsRes = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=1`,
          { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
        );
        if (!subsRes.ok) {
          throw new Error(`Stripe subscription lookup failed: ${subsRes.status}`);
        }
        const subsData = await subsRes.json();
        const sub = subsData.data?.[0];
        if (sub) {
          const cancelRes = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
          });
          if (!cancelRes.ok) {
            throw new Error(`Stripe subscription cancellation failed: ${cancelRes.status}`);
          }
        }
      }
    }

    // 2. Delete analyses
    const deleteAnalysesRes = await fetch(`${SUPABASE_URL}/rest/v1/analyses?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
    });
    if (!deleteAnalysesRes.ok) {
      throw new Error(`Failed to delete analyses: ${deleteAnalysesRes.status}`);
    }

    // 3. Delete user row
    const deleteUserRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
    });
    if (!deleteUserRes.ok) {
      throw new Error(`Failed to delete user row: ${deleteUserRes.status}`);
    }

    // 4. Delete auth user (must be last)
    const deleteAuthRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
    });
    if (!deleteAuthRes.ok) {
      throw new Error(`Failed to delete auth user: ${deleteAuthRes.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
  }
}
