# LADRESS — Backend proxy IA (Rapport de Morphologie)

Backend Vercel qui protège les clés API des 3 fournisseurs de vision IA (Anthropic, OpenAI, Google) pour le service "Rapport de Morphologie" de [ladress.re](https://ladress.re). Complément **optionnel** à l'algorithme géométrique client-side existant (MediaPipe) — pas un remplacement : voir le fichier `shopify_page_rapport_morphologie.html` dans le dépôt `second-cerveau-ladress` pour l'état de la page live.

## Principes non négociables

- **Aucune photo n'est stockée.** La fonction `api/analyze.js` est stateless : l'image reçue n'est jamais écrite sur disque, en base de données, ni journalisée en clair. Elle ne sert qu'au temps de l'appel au fournisseur choisi.
- **Les clés API ne sont jamais côté client.** Elles vivent uniquement en variables d'environnement (Vercel dashboard en prod, `.env` local ignoré par git en dev). Ne jamais les coller dans le code, un commit, ou un prompt.
- **Cet appel IA est optionnel.** L'algorithme géométrique 100% client-side reste le comportement par défaut de la page Shopify — envoyer une photo à ce backend doit être un choix explicite de la cliente (opt-in), pas systématique.

## Mise en route

```bash
npm install
cp .env.example .env
# éditer .env : coller tes clés ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY
npm run dev
```

`npm run dev` lance `vercel dev`, qui sert `api/analyze.js` en local (nécessite d'être connecté à un compte Vercel — `npx vercel login` la première fois).

## Tester l'endpoint

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"provider":"anthropic","image":"data:image/jpeg;base64,<...>"}'
```

`provider` : `anthropic` | `openai` | `google`.

## Comparer les 3 IA (coût / qualité / latence)

1. Mettre quelques photos de test (jamais commitées, voir `.gitignore`) dans `test-photos/`.
2. Renseigner les 3 clés API dans `.env`.
3. `npm run compare` — appelle les 3 providers sur chaque photo et affiche type détecté, latence et tokens consommés.

Le coût par appel n'est pas calculé automatiquement ici (les tarifs des 3 fournisseurs évoluent — vérifier leurs pages de pricing actuelles avant de comparer). Claude Haiku 4.5 avait été mesuré à ~0,7 centime/appel lors d'un test précédent avec Aurélien ; GPT-4o-mini et Gemini restent à chiffrer.

## Le prompt

`lib/prompt.js` contient le prompt "déconstruction du biais vestimentaire" envoyé aux 3 IA, rédigé par Thomas (contraintes techniques : JSON strict, raisonnement libre) et Charlotte (ton de marque L/ADRESS — bienveillant, jamais clinique, puisque ce texte pourrait un jour être lu par une cliente), validé par Aurélien le 2026-09-19. Classification seule (pas de conseils vestimentaires, déjà couverts par `REPORT_CONTENT` côté page Shopify).

## Déploiement

```bash
npx vercel link      # relie ce dossier à un projet Vercel
npx vercel env add ANTHROPIC_API_KEY
npx vercel env add OPENAI_API_KEY
npx vercel env add GOOGLE_API_KEY
npx vercel env add ALLOWED_ORIGIN   # https://ladress.re
npx vercel --prod
```

## Prochaines étapes (voir aussi le wiki `second-cerveau-ladress`)

1. Comparer les 3 IA sur des photos réelles (`npm run compare`).
2. Décider avec Aurélien si/comment l'appel IA s'intègre à la page Shopify existante (opt-in ? remplace le score de confiance géométrique ?) — décision produit, pas technique.
3. Repositionner le texte marketing de la page ("conseil de style", pas "essayage virtuel").
4. Validation manuelle explicite d'Aurélien avant toute liaison au menu ou annonce publique.
