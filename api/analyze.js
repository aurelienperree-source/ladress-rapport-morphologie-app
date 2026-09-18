import { analyzeWithAnthropic } from '../lib/providers/anthropic.js';
import { analyzeWithOpenAI } from '../lib/providers/openai.js';
import { analyzeWithGoogle } from '../lib/providers/google.js';
import { parseModelJson } from '../lib/parseResult.js';

// Aucune conservation de photo : la fonction est stateless, l'image reçue
// n'est jamais écrite sur disque ni journalisée (voir la règle RGPD du
// projet). Elle ne sert qu'à l'appel API du fournisseur choisi, le temps
// de la requête.
const PROVIDERS = {
  anthropic: analyzeWithAnthropic,
  openai: analyzeWithOpenAI,
  google: analyzeWithGoogle,
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 Mo, marge raisonnable pour une photo compressée côté client

function setCors(res) {
  const origin = process.env.ALLOWED_ORIGIN || 'https://ladress.re';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseDataUri(dataUri) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUri || '');
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const { image, provider } = req.body || {};

  if (!provider || !PROVIDERS[provider]) {
    res.status(400).json({ error: `provider invalide, attendu: ${Object.keys(PROVIDERS).join(', ')}` });
    return;
  }

  const parsedImage = parseDataUri(image);
  if (!parsedImage) {
    res.status(400).json({ error: 'image invalide, attendu un data URI image/*;base64,...' });
    return;
  }

  const approxBytes = (parsedImage.base64.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) {
    res.status(413).json({ error: 'image trop volumineuse' });
    return;
  }

  const start = Date.now();
  try {
    const result = await PROVIDERS[provider](parsedImage);
    const latencyMs = Date.now() - start;
    const { parsed, parseError } = parseModelJson(result.rawText);

    res.status(200).json({
      provider: result.provider,
      model: result.model,
      latencyMs,
      usage: result.usage,
      result: parsed,
      parseError,
      // rawText gardé pour le debug pendant la phase de comparaison —
      // à retirer de la réponse une fois l'intégration décidée avec Aurélien.
      rawText: result.rawText,
    });
  } catch (err) {
    const latencyMs = Date.now() - start;
    console.error(`[analyze] ${provider} error:`, err.message);
    res.status(502).json({ error: err.message, provider, latencyMs });
  }
}
