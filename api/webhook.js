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

// Map Stripe price IDs → subscription tier.
// Set STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_TEAM in Vercel env vars.
// Annual variants use separate price IDs: STRIPE_PRICE_STARTER_ANNUAL, etc.
function buildTierMap() {
  const map = {};
  const pairs = [
    [process.env.STRIPE_PRICE_STARTER, 'starter'],
    [process.env.STRIPE_PRICE_STARTER_ANNUAL, 'starter'],
    [process.env.STRIPE_PRICE_PRO, 'pro'],
    [process.env.STRIPE_PRICE_PRO_ANNUAL, 'pro'],
    [process.env.STRIPE_PRICE_TEAM, 'team'],
    [process.env.STRIPE_PRICE_TEAM_ANNUAL, 'team'],
  ];
  for (const [priceId, tier] of pairs) {
    if (priceId) map[priceId] = tier;
  }
  return map;
}
const TIER_BY_PRICE_ID = buildTierMap();

async function getSubscriptionPriceId(subscriptionId) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  const sub = await res.json();
  return sub.items?.data?.[0]?.price?.id || null;
}

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
    const today = new Date().toISOString().split('T')[0];

    if (!email) {
      console.error('Webhook: no email on session', session.id);
      return res.status(200).json({ received: true });
    }

    const priceId = session.subscription
      ? await getSubscriptionPriceId(session.subscription)
      : null;
    const tier = (priceId && TIER_BY_PRICE_ID[priceId]) || null;

    if (!tier) {
      const err = new Error(`Webhook: unrecognized price ID "${priceId}" on session ${session.id} for ${email}`);
      console.error(err.message);
      Sentry.captureException(err);
      return res.status(400).json({ error: 'Unrecognized price ID — webhook will retry.' });
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
      // upgrade logged via Sentry breadcrumb if needed
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
    }
  }

  // ── customer.subscription.deleted → downgrade to free ────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const email = await getCustomerEmail(subscription.customer);
    if (email) {
      await patchUser(SUPABASE_URL, SERVICE_KEY, email, { subscription_tier: 'free' });
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
    } else if (status === 'active' || status === 'trialing') {
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const tier = priceId ? TIER_BY_PRICE_ID[priceId] : undefined;
      if (tier) {
        await patchUser(SUPABASE_URL, SERVICE_KEY, email, { subscription_tier: tier });
      } else {
        const err = new Error(`Webhook: unrecognized price ID "${priceId}" for ${email} (subscription ${subscription.id})`);
        console.error(err.message);
        Sentry.captureException(err);
        return res.status(400).json({ error: 'Unrecognized price amount — webhook will retry.' });
      }
    }
  }

  return res.status(200).json({ received: true });
}
