import { MORPHOLOGY_VISION_PROMPT } from '../prompt.js';

// Claude Haiku 4.5 — déjà validé par Aurélien dans le test précédent
// (~0,7 centime/appel, verdict cohérent avec l'algo géométrique).
const MODEL = 'claude-haiku-4-5-20251001';

export async function analyzeWithAnthropic({ base64, mediaType }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: MORPHOLOGY_VISION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  const usage = data.usage ?? {};

  return {
    provider: 'anthropic',
    model: MODEL,
    rawText: text,
    usage: {
      inputTokens: usage.input_tokens ?? null,
      outputTokens: usage.output_tokens ?? null,
    },
  };
}
