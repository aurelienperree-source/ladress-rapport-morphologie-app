// Les 3 IA renvoient parfois le JSON entouré de texte ou de ```fences```
// malgré la consigne "réponds strictement en JSON" — on extrait le premier
// bloc { ... } valide plutôt que de faire échouer tout l'appel.
export function parseModelJson(rawText) {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    return { parsed: null, parseError: 'Aucun JSON trouvé dans la réponse' };
  }
  try {
    return { parsed: JSON.parse(match[0]), parseError: null };
  } catch (e) {
    return { parsed: null, parseError: e.message };
  }
}
