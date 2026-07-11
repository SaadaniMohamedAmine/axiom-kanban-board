# Rappels — choses à vérifier / reprendre plus tard

> Fichier de suivi des points laissés en suspens pendant le développement, à re-vérifier ou finaliser ultérieurement.

---

## Vercel Speed Insights — non activé sur axiom-kanban-board

**Statut** : ⏭️ Reporté (pas bloquant)

**Contexte** : Le composant `<SpeedInsights />` est bien intégré dans le code (`src/app/layout.tsx`), mais **la collecte de données n'est pas active** sur le projet `axiom-kanban-board` côté dashboard Vercel.

**Pourquoi** : Le plan **Hobby** (gratuit) de Vercel limite Speed Insights à **un seul projet actif à la fois** sur le compte. Speed Insights est déjà activé sur un autre projet du compte (`saadanimohamedamines-projects`), donc l'activer ici demanderait :
- soit de **désactiver** Speed Insights sur l'autre projet (swap gratuit, mais perte de données sur l'autre projet),
- soit d'**upgrader vers le plan Pro** (payant).

**Décision prise** : on laisse tel quel — aucun changement côté Vercel, aucun upgrade.

**Alternative retenue pour obtenir les mêmes métriques** : utiliser **Google PageSpeed Insights** (https://pagespeed.web.dev/) ou l'onglet **Lighthouse** de Chrome DevTools, pointés directement sur l'URL de prod (`axiom-kanban-board.vercel.app`). Ça donne les mêmes Core Web Vitals (LCP, CLS, INP, TTFB, FCP) sans dépendre du produit Speed Insights ni de son quota de plan.

**Où ça doit ressortir plus tard** : cette alternative correspond déjà à ce qui est prévu dans `PROGRESS.md` — **Phase 10 (Recruiter-Ready Packaging)**, item *"Score Lighthouse/Core Web Vitals affiché (README ou landing)"*. Rien à changer au plan existant, juste à exécuter Lighthouse/PageSpeed manuellement quand on arrivera à cette phase.

**Vérifications correspondantes toujours valables (dans `src/app/layout.tsx`)** :
- [x] `<Analytics />` correctement monté et actif (Web Analytics activé, confirmé fonctionnel)
- [x] `<SpeedInsights />` correctement monté dans le code (aucune erreur console, aucun impact DX en dev)
- [ ] Données Speed Insights réelles → **non applicable ici**, remplacé par Lighthouse/PageSpeed en Phase 10

---
