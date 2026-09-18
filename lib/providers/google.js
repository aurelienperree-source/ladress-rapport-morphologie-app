import { MORPHOLOGY_VISION_PROMPT } from '../prompt.js';

const MODEL = 'gemini-1.5-flash';

export async function analyzeWithGoogle({ base64, mediaType }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY manquante');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: MORPHOLOGY_VISION_PROMPT },
            { inline_data: { mime_type: mediaType, data: base64 } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  const usage = data.usageMetadata ?? {};

  return {
    provider: 'google',
    model: MODEL,
    rawText: text,
    usage: {
      inputTokens: usage.promptTokenCount ?? null,
      outputTokens: usage.candidatesTokenCount ?? null,
    },
  };
}
