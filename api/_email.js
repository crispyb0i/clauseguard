const FROM = 'ClauseGuard <hello@clauseguard.io>';
const RESEND_API = 'https://api.resend.com/emails';

export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not set — skipping email to', to);
    return;
  }
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
  }
}

export const EMAILS = {
  welcome: (email) => ({
    to: email,
    subject: 'Your first contract analysis is ready 🎉',
    html: `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0d1b2a;color:#f5f0e8;">
  <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#f5f0e8;">Welcome to ClauseGuard</h1>
  <p style="font-size:15px;color:rgba(245,240,232,0.7);line-height:1.6;margin-bottom:20px;">You just ran your first contract analysis. Here's how to get the most out of it:</p>
  <ul style="font-size:14px;color:rgba(245,240,232,0.7);line-height:1.8;padding-left:20px;margin-bottom:24px;">
    <li>Review every <strong style="color:#c9a84c;">red flag</strong> — these are the clauses that could cost you</li>
    <li>Use the negotiation suggestions as a starting point with the other party</li>
    <li>Copy the report and share it with a lawyer for complex agreements</li>
  </ul>
  <a href="https://clauseguard.io/app" style="display:inline-block;background:#c9a84c;color:#0d1b2a;padding:12px 28px;border-radius:5px;text-decoration:none;font-weight:600;font-size:14px;">Analyze another contract →</a>
  <p style="font-size:12px;color:rgba(245,240,232,0.35);margin-top:32px;">ClauseGuard · Not legal advice · <a href="https://clauseguard.io/tos" style="color:rgba(245,240,232,0.35);">Unsubscribe</a></p>
</div>`,
  }),

  tip: (email) => ({
    to: email,
    subject: 'The 5 contract clauses ClauseGuard catches most often',
    html: `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0d1b2a;color:#f5f0e8;">
  <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#f5f0e8;">5 clauses to watch in every contract</h1>
  <p style="font-size:14px;color:rgba(245,240,232,0.7);line-height:1.6;margin-bottom:20px;">Based on thousands of contract analyses, these are the red flags that come up most:</p>
  <ol style="font-size:14px;color:rgba(245,240,232,0.7);line-height:2;padding-left:20px;margin-bottom:24px;">
    <li><strong style="color:#f5f0e8;">Auto-renewal clauses</strong> — contracts that renew silently unless cancelled</li>
    <li><strong style="color:#f5f0e8;">One-sided IP assignment</strong> — handing over all intellectual property</li>
    <li><strong style="color:#f5f0e8;">Unlimited liability</strong> — no cap on what you can be held responsible for</li>
    <li><strong style="color:#f5f0e8;">Broad non-competes</strong> — restrictions that prevent future work</li>
    <li><strong style="color:#f5f0e8;">Short termination notice</strong> — the other party can end the agreement too quickly</li>
  </ol>
  <a href="https://clauseguard.io/app" style="display:inline-block;background:#c9a84c;color:#0d1b2a;padding:12px 28px;border-radius:5px;text-decoration:none;font-weight:600;font-size:14px;">Check your next contract →</a>
  <p style="font-size:12px;color:rgba(245,240,232,0.35);margin-top:32px;">ClauseGuard · Not legal advice · <a href="https://clauseguard.io/tos" style="color:rgba(245,240,232,0.35);">Unsubscribe</a></p>
</div>`,
  }),

  upgrade: (email, used, limit) => ({
    to: email,
    subject: `You've used ${used} of ${limit} free analyses this month`,
    html: `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0d1b2a;color:#f5f0e8;">
  <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;color:#f5f0e8;">Running low on analyses?</h1>
  <p style="font-size:14px;color:rgba(245,240,232,0.7);line-height:1.6;margin-bottom:20px;">You've used <strong style="color:#c9a84c;">${used} of your ${limit} free analyses</strong> this month. Upgrade to keep reviewing contracts without limits.</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr>
      <td style="padding:12px;border:1px solid rgba(201,168,76,0.2);font-size:13px;color:rgba(245,240,232,0.7);">Starter — $29/mo</td>
      <td style="padding:12px;border:1px solid rgba(201,168,76,0.2);font-size:13px;color:#f5f0e8;">10 analyses/month</td>
    </tr>
    <tr>
      <td style="padding:12px;border:1px solid rgba(201,168,76,0.2);font-size:13px;color:rgba(245,240,232,0.7);">Pro — $59/mo</td>
      <td style="padding:12px;border:1px solid rgba(201,168,76,0.2);font-size:13px;color:#f5f0e8;">50 analyses/month</td>
    </tr>
  </table>
  <a href="https://clauseguard.io/#pricing" style="display:inline-block;background:#c9a84c;color:#0d1b2a;padding:12px 28px;border-radius:5px;text-decoration:none;font-weight:600;font-size:14px;">View plans →</a>
  <p style="font-size:12px;color:rgba(245,240,232,0.35);margin-top:32px;">ClauseGuard · Not legal advice · <a href="https://clauseguard.io/tos" style="color:rgba(245,240,232,0.35);">Unsubscribe</a></p>
</div>`,
  }),
};
