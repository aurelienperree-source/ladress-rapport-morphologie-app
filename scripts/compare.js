// Compare les 3 IA de vision sur les photos du dossier test-photos/.
// Usage : npm run compare  (nécessite les clés API en variables d'env locales)
//
// Ce script appelle les providers en direct (pas via l'API Vercel), pour
// itérer vite en local. Les photos de test.ne doivent jamais être commitées
// (voir .gitignore) — mets tes propres photos dans test-photos/ avant de lancer.
import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { analyzeWithAnthropic } from '../lib/providers/anthropic.js';
import { analyzeWithOpenAI } from '../lib/providers/openai.js';
import { analyzeWithGoogle } from '../lib/providers/google.js';
import { parseModelJson } from '../lib/parseResult.js';

const TEST_DIR = new URL('../test-photos/', import.meta.url).pathname;
const MEDIA_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

const PROVIDERS = [
  ['anthropic', analyzeWithAnthropic],
  ['openai', analyzeWithOpenAI],
  ['google', analyzeWithGoogle],
];

function loadTestPhotos() {
  let files;
  try {
    files = readdirSync(TEST_DIR);
  } catch {
    return [];
  }
  return files
    .filter((f) => MEDIA_TYPES[extname(f).toLowerCase()])
    .map((f) => ({
      name: f,
      mediaType: MEDIA_TYPES[extname(f).toLowerCase()],
      base64: readFileSync(join(TEST_DIR, f)).toString('base64'),
    }));
}

async function run() {
  const photos = loadTestPhotos();
  if (!photos.length) {
    console.log(`Aucune photo dans ${TEST_DIR} — ajoute des .jpg/.png de test avant de relancer.`);
    return;
  }

  for (const photo of photos) {
    console.log(`\n=== ${photo.name} ===`);
    for (const [name, fn] of PROVIDERS) {
      const start = Date.now();
      try {
        const result = await fn({ base64: photo.base64, mediaType: photo.mediaType });
        const latencyMs = Date.now() - start;
        const { parsed, parseError } = parseModelJson(result.rawText);
        console.log(`[${name}] ${latencyMs}ms`, parsed || `(parse error: ${parseError})`, 'usage:', result.usage);
      } catch (err) {
        console.log(`[${name}] ERREUR:`, err.message);
      }
    }
  }
}

run();
