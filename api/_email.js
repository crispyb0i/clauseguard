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
  const body = await res.text();
  if (!res.ok) {
    console.error('Resend error', res.status, body);
  } else {
    console.log('Resend ok', res.status, body);
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

  checklist: (email) => ({
    to: email,
    subject: '5 contract clauses that cost freelancers the most (free checklist)',
    html: `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:580px;margin:0 auto;padding:40px 24px;background:#0d1b2a;color:#f5f0e8;">

  <p style="font-size:13px;color:rgba(245,240,232,0.4);margin-bottom:24px;letter-spacing:0.05em;text-transform:uppercase;">ClauseGuard · Contract Red Flags Checklist</p>

  <h1 style="font-size:24px;font-weight:700;margin-bottom:12px;color:#f5f0e8;line-height:1.3;">5 Contract Clauses That Cost Freelancers the Most</h1>
  <p style="font-size:15px;color:rgba(245,240,232,0.65);line-height:1.7;margin-bottom:36px;">Before you sign your next contract, run through this list. Each one is a clause we see regularly — and each one has cost freelancers real money.</p>

  <!-- Flag 1 -->
  <div style="border-left:3px solid #f87171;padding:16px 20px;margin-bottom:20px;background:rgba(248,113,113,0.06);border-radius:0 6px 6px 0;">
    <p style="font-size:12px;font-weight:700;color:#f87171;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Red Flag #1</p>
    <p style="font-size:16px;font-weight:700;color:#f5f0e8;margin-bottom:8px;">"Revisions until the client is satisfied"</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;margin-bottom:10px;"><strong style="color:#f5f0e8;">Why it's dangerous:</strong> "Satisfied" is subjective. A client can request unlimited rounds of changes with no end date and no additional pay. You've essentially agreed to work for free until they decide to stop.</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;"><strong style="color:#c9a84c;">Counter-clause:</strong> Replace with a fixed number — "up to 2 rounds of revisions included; additional rounds billed at $X/hour."</p>
  </div>

  <!-- Flag 2 -->
  <div style="border-left:3px solid #f87171;padding:16px 20px;margin-bottom:20px;background:rgba(248,113,113,0.06);border-radius:0 6px 6px 0;">
    <p style="font-size:12px;font-weight:700;color:#f87171;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Red Flag #2</p>
    <p style="font-size:16px;font-weight:700;color:#f5f0e8;margin-bottom:8px;">"Payment due upon client's approval"</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;margin-bottom:10px;"><strong style="color:#f5f0e8;">Why it's dangerous:</strong> The client controls the trigger. They can withhold "approval" indefinitely, meaning they can delay payment forever by simply not approving — even on work that's objectively complete.</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;"><strong style="color:#c9a84c;">Counter-clause:</strong> "Payment due within 14 days of delivery. If no written objection is received within 5 business days, the work is deemed accepted."</p>
  </div>

  <!-- Flag 3 -->
  <div style="border-left:3px solid #f87171;padding:16px 20px;margin-bottom:20px;background:rgba(248,113,113,0.06);border-radius:0 6px 6px 0;">
    <p style="font-size:12px;font-weight:700;color:#f87171;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Red Flag #3</p>
    <p style="font-size:16px;font-weight:700;color:#f5f0e8;margin-bottom:8px;">IP assignment that includes your pre-existing work</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;margin-bottom:10px;"><strong style="color:#f5f0e8;">Why it's dangerous:</strong> Broad IP clauses often say "all work product, including materials created prior to this agreement." That can transfer ownership of your templates, tools, and frameworks you've built over years — not just what you made for this client.</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;"><strong style="color:#c9a84c;">Counter-clause:</strong> Add: "IP assignment applies only to deliverables created specifically for this project. Freelancer retains all rights to pre-existing tools, code libraries, and templates."</p>
  </div>

  <!-- Flag 4 -->
  <div style="border-left:3px solid #fbbf24;padding:16px 20px;margin-bottom:20px;background:rgba(251,191,36,0.06);border-radius:0 6px 6px 0;">
    <p style="font-size:12px;font-weight:700;color:#fbbf24;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Red Flag #4</p>
    <p style="font-size:16px;font-weight:700;color:#f5f0e8;margin-bottom:8px;">Termination without cause — and no kill fee</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;margin-bottom:10px;"><strong style="color:#f5f0e8;">Why it's dangerous:</strong> If a client can cancel anytime with 48 hours' notice and owes you nothing beyond hours logged, they can terminate after you've completed 90% of the project — and pay only for logged time, not the value of the finished work they're walking away with.</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;"><strong style="color:#c9a84c;">Counter-clause:</strong> Add a kill fee: "If terminated without cause, client owes 25% of remaining contract value, due within 7 days."</p>
  </div>

  <!-- Flag 5 -->
  <div style="border-left:3px solid #fbbf24;padding:16px 20px;margin-bottom:32px;background:rgba(251,191,36,0.06);border-radius:0 6px 6px 0;">
    <p style="font-size:12px;font-weight:700;color:#fbbf24;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Red Flag #5</p>
    <p style="font-size:16px;font-weight:700;color:#f5f0e8;margin-bottom:8px;">One-sided indemnification</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;margin-bottom:10px;"><strong style="color:#f5f0e8;">Why it's dangerous:</strong> Many contracts require you to indemnify (cover legal costs for) the client against "any and all claims arising from this agreement." That includes claims caused by the client's own actions or their other vendors.</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.65);line-height:1.6;"><strong style="color:#c9a84c;">Counter-clause:</strong> Limit to: "Freelancer indemnifies client only against claims arising directly from Freelancer's own negligence or breach of this agreement."</p>
  </div>

  <!-- CTA -->
  <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
    <p style="font-size:15px;font-weight:600;color:#f5f0e8;margin-bottom:8px;">See any of these in your current contract?</p>
    <p style="font-size:14px;color:rgba(245,240,232,0.6);margin-bottom:20px;">ClauseGuard scans for all five — plus dozens more — in seconds. Free to start.</p>
    <a href="https://clauseguard.io/login" style="display:inline-block;background:#c9a84c;color:#0d1b2a;padding:13px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Get 3 free analyses →</a>
  </div>

  <p style="font-size:12px;color:rgba(245,240,232,0.3);line-height:1.6;">ClauseGuard provides AI-generated analysis for informational purposes only. This is not legal advice. Always consult a qualified attorney before signing legally binding agreements.<br><br><a href="https://clauseguard.io/tos" style="color:rgba(245,240,232,0.3);">Unsubscribe</a></p>

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
