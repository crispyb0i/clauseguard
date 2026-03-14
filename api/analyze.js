export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, filename } = req.body;

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: 'Contract text too short or missing.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

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
      // Try extracting JSON if there's any wrapping text
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse response as JSON');
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
