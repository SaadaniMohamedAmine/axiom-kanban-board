# 012 — Changelog / Release Notes

> Doc d'entrée pour `specify.specify`. Feature bonus — product lifecycle signal.

## Contexte / Objectif

Créer une page publique de changelog versionnée (v0.1 → v1.0) qui transforme Axiom d'un "exercice de portfolio terminé" en un "produit vivant avec un historique de livraison" — signal fort de pensée Product Manager.

## User Stories

- En tant que visiteur/recruteur, je consulte l'historique des versions du produit et ce qui a été livré à chaque release.
- En tant que owner produit, j'ajoute une nouvelle entrée de changelog simplement en éditant un fichier Markdown.

## Exigences fonctionnelles

- **FR-1201** — Page `/changelog` publique, accessible sans authentification.
- **FR-1202** — Chaque entrée de changelog contient : numéro de version (vX.Y.Z), date de release, catégories (New / Improved / Fixed), liste de changements.
- **FR-1203** — Le contenu du changelog est géré via des fichiers Markdown dans `/content/changelog/` (pas de CMS, pas de DB) — rendu via MDX ou remark.
- **FR-1204** — Design on-brand Axiom (dark, typographie Geist, même palette) — pas de template générique.
- **FR-1205** — Lien vers la page changelog depuis la landing page et/ou le footer de l'app.
- **FR-1206** — Au minimum 3 entrées de changelog rédigées (v0.1, v0.2, v1.0) avec du contenu réaliste reflétant les phases implémentées.

## Critères d'acceptation

- La page `/changelog` se charge sans authentification.
- Les 3 entrées minimales sont affichées avec dates, versions et contenu réaliste.
- Le design est cohérent avec le reste du produit (même tokens, même typographie).
- Ajouter une nouvelle entrée Markdown dans `/content/changelog/` la publie automatiquement sur la page.

## Dépendances techniques

Next.js (App Router, page statique ou SSG), MDX ou `gray-matter` + `remark`, design system Axiom. Aucune dépendance DB.

## Hors-périmètre

- Notifications aux utilisateurs lors d'une nouvelle release (emails, push).
- Système de versioning automatique lié aux tags Git.
