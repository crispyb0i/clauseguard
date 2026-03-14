import crypto from 'crypto';
import { Sentry } from './_sentry.js';

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Map Stripe price amount (cents) → subscription tier
const TIER_BY_AMOUNT = { 2900: 'starter', 5900: 'pro', 9900: 'team' };

async function getCustomerEmail(customerId) {
  const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
    headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  const customer = await res.json();
  return customer.email || null;
}

async function patchUser(supabaseUrl, serviceKey, email, fields) {
  await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fields),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const raw = await readRawBody(req);
  const sigHeader = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sigHeader || !secret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret.' });
  }

  // ── Verify Stripe signature ───────────────────────────────────────────────
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k === 't') acc.timestamp = v;
    else if (k === 'v1') acc.sigs.push(v);
    return acc;
  }, { timestamp: null, sigs: [] });

  if (!parts.timestamp) {
    return res.status(400).json({ error: 'Invalid signature header.' });
  }

  const signedPayload = `${parts.timestamp}.${raw}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  const isValid = parts.sigs.some(sig => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    } catch { return false; }
  });

  if (!isValid) {
    console.error('Stripe webhook signature verification failed');
    return res.status(400).json({ error: 'Webhook signature verification failed.' });
  }

  // ── Handle event ──────────────────────────────────────────────────────────
  let event;
  try {
    event = JSON.parse(raw.toString());
  } catch (e) {
    Sentry.captureException(e);
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ── checkout.session.completed → upgrade user ─────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    const tier = TIER_BY_AMOUNT[session.amount_total] || 'starter';
    const today = new Date().toISOString().split('T')[0];

    if (!email) {
      console.error('Webhook: no email on session', session.id);
      return res.status(200).json({ received: true });
    }

    const lookupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`,
      { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
    );
    const users = await lookupRes.json();

    if (Array.isArray(users) && users.length > 0) {
      await patchUser(SUPABASE_URL, SERVICE_KEY, email, {
        subscription_tier: tier,
        analyses_used: 0,
        analyses_reset_date: today,
      });
      console.log(`Upgraded ${email} to ${tier}`);
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/pending_subscriptions`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ email, subscription_tier: tier }),
      });
      console.log(`Stored pending subscription for ${email} (${tier})`);
    }
  }

  // ── customer.subscription.deleted → downgrade to free ────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const email = await getCustomerEmail(subscription.customer);
    if (email) {
      await patchUser(SUPABASE_URL, SERVICE_KEY, email, { subscription_tier: 'free' });
      console.log(`Downgraded ${email} to free (subscription cancelled)`);
    }
  }

  // ── customer.subscription.updated → sync tier or downgrade ───────────────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const email = await getCustomerEmail(subscription.customer);
    if (!email) return res.status(200).json({ received: true });

    const { status } = subscription;

    if (['past_due', 'unpaid', 'canceled'].includes(status)) {
      await patchUser(SUPABASE_URL, SERVICE_KEY, email, { subscription_tier: 'free' });
      console.log(`Downgraded ${email} to free (status: ${status})`);
    } else if (status === 'active') {
      const amount = subscription.items?.data?.[0]?.price?.unit_amount;
      const tier = TIER_BY_AMOUNT[amount];
      if (tier) {
        await patchUser(SUPABASE_URL, SERVICE_KEY, email, { subscription_tier: tier });
        console.log(`Updated ${email} to ${tier} (subscription updated)`);
      }
    }
  }

  return res.status(200).json({ received: true });
}
