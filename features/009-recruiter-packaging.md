# 009 — Recruiter-Ready Packaging

> Doc d'entrée pour `specify.specify`. Correspond à Phase 10 du PROGRESS.md.

## Contexte / Objectif

Transformer un produit techniquement et visuellement abouti (Phases 0-9) en un élément de portfolio qui convertit en 30 secondes l'attention d'un recruteur. Cette phase ne touche pas au produit lui-même mais à sa présentation et sa preuve de qualité.

## User Stories

- En tant que recruteur, je lis un README qui explique les décisions techniques et produit, pas juste une liste de technologies.
- En tant que recruteur, j'ouvre la démo et tout fonctionne dès le premier clic, avec des données réalistes déjà présentes.
- En tant que recruteur, je vois une preuve objective de qualité (tests verts, score de performance) sans avoir à auditer le code moi-même.
- En tant que recruteur pressé, je regarde une vidéo de 30-60 secondes qui montre le produit en action plutôt que de tester moi-même.
- En tant que owner du portfolio, je dispose de visuels réutilisables pour mon site personnel et LinkedIn.

## Exigences fonctionnelles

- **FR-801** — Rédiger un README structuré : pitch produit, captures d'écran, lien démo, stack technique justifiée (pourquoi Better Auth plutôt qu'Auth.js, pourquoi Groq+Gemini, pourquoi tout-Next.js plutôt que Fastify/Socket.io), instructions de lancement local.
- **FR-802** — Peupler le Workspace de démo avec des données réalistes (boards, tâches, sprints, commentaires) représentatives d'une vraie équipe produit.
- **FR-803** — Garantir un accès démo sans friction : pas de login obligatoire pour explorer, ou compte de démo pré-rempli en un clic.
- **FR-804** — Configurer une CI (GitHub Actions ou équivalent) exécutant la suite Playwright à chaque push, avec badge de statut affiché dans le README.
- **FR-805** — Mesurer et afficher le score Lighthouse/Core Web Vitals (capture ou badge) dans le README ou sur la landing page.
- **FR-806** — Produire une vidéo ou GIF de démonstration courte (30-60s) montrant : reasoning stream IA, drag & drop, et la vue mobile.
- **FR-807** — Produire un set de captures d'écran premium (desktop + mobile) réutilisables pour le portfolio personnel et LinkedIn.

## Critères d'acceptation

- Un lecteur externe du README comprend en moins de 2 minutes ce que fait le produit et pourquoi les choix techniques ont été faits.
- La démo publique ne présente aucune étape cassée ou écran vide au premier parcours.
- Le badge CI affiché reflète l'état réel de la dernière suite de tests exécutée.
- La vidéo/GIF démo se charge et se lit correctement depuis le README (hébergement vérifié).
- Les captures d'écran sont cohérentes avec la dernière version déployée du produit (pas de captures obsolètes).

## Dépendances techniques

GitHub Actions (ou équivalent CI), Playwright (Phase 8), Lighthouse CI ou audit manuel, outil de capture vidéo/GIF (ex. screen recording + compression). Dépend de toutes les phases précédentes étant fonctionnelles et stables.

**Contrainte d'implémentation UI :** aucune nouvelle UI à produire ici — cette phase documente et capture le produit existant. Les captures/vidéos doivent montrer le produit dans l'état final conforme à `axiom-design/` et au motion design de la Phase 9.

## Hors-périmètre

- Refonte du produit suite à cette phase — si un défaut majeur est découvert ici, il déclenche un retour vers la phase concernée plutôt qu'un correctif ad hoc dans le packaging.
- Promotion active (réseaux sociaux, candidature) — cette phase prépare les assets, ne les diffuse pas.
