import { MORPHOLOGY_VISION_PROMPT } from '../prompt.js';

const MODEL = 'gpt-4o-mini';

export async function analyzeWithOpenAI({ base64, mediaType }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY manquante');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: MORPHOLOGY_VISION_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  const usage = data.usage ?? {};

  return {
    provider: 'openai',
    model: MODEL,
    rawText: text,
    usage: {
      inputTokens: usage.prompt_tokens ?? null,
      outputTokens: usage.completion_tokens ?? null,
    },
  };
}
