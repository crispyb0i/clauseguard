export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = authHeader.slice(7);

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  // Verify JWT with Supabase
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!authRes.ok) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const authUser = await authRes.json();
  const email = authUser.email;

  if (!email) {
    return res.status(400).json({ error: 'No email associated with account.' });
  }

  // ── Look up Stripe customer by email ──────────────────────────────────────
  const searchRes = await fetch(
    `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
    { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
  );
  const searchData = await searchRes.json();
  const customer = searchData.data?.[0];

  if (!customer) {
    return res.status(404).json({ error: 'No billing account found. You may not have an active subscription.' });
  }

  // ── Create billing portal session ─────────────────────────────────────────
  const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: customer.id,
      return_url: 'https://www.clauseguard.io/app',
    }),
  });

  if (!portalRes.ok) {
    const err = await portalRes.json();
    console.error('Stripe portal error:', err);
    return res.status(500).json({ error: 'Could not create billing portal session.' });
  }

  const portal = await portalRes.json();
  return res.status(200).json({ url: portal.url });
}
