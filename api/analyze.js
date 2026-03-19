import { randomBytes } from 'crypto';
import { Sentry } from './_sentry.js';
import { sendEmail, EMAILS } from './_email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.slice(7);

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

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
  const userId = authUser.id;

  // ── Load user record ──────────────────────────────────────────────────────
  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=subscription_tier,analyses_used,analyses_reset_date,last_analysis_at,bonus_analyses`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  let userRows = await dbRes.json();

  // Auto-create record if missing (edge case: trigger didn't fire)
  if (!Array.isArray(userRows) || userRows.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    const referralCode = randomBytes(4).toString('hex');
    await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: userId,
        email: authUser.email,
        subscription_tier: 'free',
        analyses_used: 0,
        analyses_reset_date: today,
        referral_code: referralCode,
        bonus_analyses: 0,
      }),
    });
    userRows = [{ subscription_tier: 'free', analyses_used: 0, analyses_reset_date: today, bonus_analyses: 0 }];
  }

  const user = userRows[0];
  let analysesUsed = user.analyses_used ?? 0;

  // ── Monthly reset ─────────────────────────────────────────────────────────
  const resetDate = new Date(user.analyses_reset_date);
  const daysSinceReset = (Date.now() - resetDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReset > 30) {
    analysesUsed = 0;
    const today = new Date().toISOString().split('T')[0];
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analyses_used: 0, analyses_reset_date: today }),
    });
  }

  // ── Tier enforcement ──────────────────────────────────────────────────────
  const LIMITS = { free: 3, starter: 10, pro: 50, team: Infinity };
  const tier = user.subscription_tier || 'free';
  const limit = LIMITS[tier] ?? 3;
  const bonusAnalyses = user.bonus_analyses ?? 0;
  const effectiveLimit = limit === Infinity ? Infinity : limit + bonusAnalyses;

  if (effectiveLimit !== Infinity && analysesUsed >= effectiveLimit) {
    return res.status(403).json({
      error: `You've used all ${effectiveLimit} analyses on your ${tier} plan this month. Upgrade to continue.`,
      tier,
      limit: effectiveLimit,
      used: analysesUsed,
    });
  }

  // ── Rate limiting (15s cooldown per user) ────────────────────────────────
  if (user.last_analysis_at) {
    const secondsSinceLast = (Date.now() - new Date(user.last_analysis_at).getTime()) / 1000;
    if (secondsSinceLast < 15) {
      return res.status(429).json({
        error: `Please wait ${Math.ceil(15 - secondsSinceLast)} seconds before analyzing another contract.`,
      });
    }
  }

  // ── Contract text ─────────────────────────────────────────────────────────
  const { text, filename } = req.body;
  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Contract text too short or missing.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured.' });

  const prompt = `You are an expert contract lawyer. Analyze the following contract and return ONLY a valid JSON object with no markdown, no backticks, no explanation — just raw JSON.

Contract text:
"""
${text.slice(0, 12000)}
"""

Return this exact JSON structure:
{
  "riskScore": <integer 0-100, where 0=very favorable, 100=very risky>,
  "riskLabel": <"Low Risk" | "Medium Risk" | "High Risk">,
  "summary": <2-3 sentence plain English summary of what this contract is and what the signing party is agreeing to>,
  "keyTerms": [
    { "label": <string>, "value": <string> }
  ],
  "redFlags": [
    { "severity": <"high" | "medium">, "clause": <short clause name>, "issue": <1 sentence explaining the problem>, "suggestion": <1 sentence counter-suggestion> }
  ],
  "positives": [
    <short string describing something favorable or standard in the contract>
  ]
}

keyTerms should include: payment terms, duration/term length, termination notice, governing law, and any other critical terms found. Include 4-8 items.
redFlags should list every problematic clause. If none, return empty array.
positives should list 2-4 things that are standard or favorable.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'Analysis service error. Please try again.' });
    }

    const data = await response.json();
    const raw = data.content[0].text.trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) result = JSON.parse(match[0]);
      else throw new Error('Could not parse response as JSON');
    }

    // ── Day 0 welcome email (first analysis only) ─────────────────────────
    if (analysesUsed === 0 && authUser.email) {
      sendEmail(EMAILS.welcome(authUser.email)).catch(() => {});
    }

    // ── Increment usage ───────────────────────────────────────────────────
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analyses_used: analysesUsed + 1, last_analysis_at: new Date().toISOString() }),
    });

    // ── Save to history ───────────────────────────────────────────────────
    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/analyses`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        filename: filename || 'Pasted text',
        risk_score: result.riskScore,
        risk_label: result.riskLabel,
        summary: result.summary,
        result,
      }),
    });

    const saved = saveRes.ok ? await saveRes.json() : [];
    const shareToken = saved[0]?.share_token ?? null;

    return res.status(200).json({ ...result, _shareToken: shareToken });
  } catch (err) {
    Sentry.captureException(err);
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
