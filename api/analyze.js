// api/analyze.js
// Vercel serverless function — proxies Anthropic API so the key stays secret

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — allow your GitHub Pages domain and localhost
  const allowed = [
    process.env.ALLOWED_ORIGIN,      // e.g. https://yourusername.github.io
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ].filter(Boolean);

  const origin = req.headers.origin || '';
  if (allowed.length && !allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0]);
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { weight, waist, chest, arm, energy, appetite, workouts } = req.body;

  if (!weight) {
    return res.status(400).json({ error: 'Weight is required' });
  }

  const prompt = `You are Johnson Saimon's Tanzanian fitness coach. He is 24, started at 52 kg, target 56–58 kg in 3 months via bodyweight training at home. Daily target 2,400–2,500 kcal, 130g protein. He uses local Tanzanian foods only — no supplements, no imported foods. He is a full-time university student with 3 jobs and limited time.

Monthly check-in data:
- Current weight: ${weight} kg (started at 52 kg)
- Waist: ${waist || 'not given'} cm
- Chest: ${chest || 'not given'} cm
- Upper arm: ${arm || 'not given'} cm
- Energy level: ${energy || 'not given'}/10
- Appetite: ${appetite || 'not given'}/10
- Workouts completed this month: ${workouts || 'not given'}

Write a short, warm, direct coaching response in plain text only — no bullet points, no markdown, no asterisks, no headers. Cover: (1) honest progress assessment, (2) one specific food or portion adjustment using local Tanzanian foods like maharage, dagaa, wali, ndizi, mayai, karanga, or kuku, (3) one specific workout adjustment, and (4) one motivational line for a student juggling university and 3 jobs. Maximum 130 words.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `Anthropic API error ${response.status}`,
      });
    }

    const data = await response.json();
    const text = data.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('') || 'No response received.';

    return res.status(200).json({ result: text });
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ error: err.message });
  }
}
