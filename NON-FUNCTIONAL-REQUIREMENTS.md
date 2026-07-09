# Axiom — Non-Functional Requirements

> À intégrer dans la constitution Speckit. Couvre sécurité, accessibilité, performance, fiabilité.

## Sécurité

- **Secrets jamais committés.** Toutes les clés (DB, OpenAI/AI provider, Pusher, Better Auth) en variables d'environnement (`.env.local`, jamais poussé en repo). Leçon retenue de PulseAI (clés API exposées) — checklist de revue avant chaque commit/push public.
- **Rotation des clés** documentée dans le README — toute clé utilisée en démo publique doit avoir un scope minimal (read-only quand possible) et une limite de quota.
- **Validation des entrées** sur tous les endpoints API (Zod côté Next.js API Routes/Server Actions) — en particulier les endpoints IA, qui reçoivent du contenu utilisateur libre (titres de tâches, descriptions).
- **Rate limiting** sur les endpoints IA (`/api/ai/*`) pour éviter l'abus en démo publique et contrôler les coûts d'API IA.
- **Permissions par rôle** vérifiées côté serveur (jamais seulement côté client) — un Viewer ne doit jamais pouvoir exécuter une action de suppression même en bypassant l'UI.
- **Mode démo isolé** : le workspace de démo publique (sans auth) doit être sandboxé — pas d'accès aux vraies données utilisateurs, reset périodique des données de démo.

## Accessibilité

- **WCAG AA minimum** sur tout le produit, y compris dans l'esthétique dark/glow (contraste texte ≥ 4.5:1, déjà spécifié dans `BRAND-IDENTITY.md`).
- **Navigation clavier complète** : raccourcis (⌘K, N/E/D), focus visible sur tous les éléments interactifs, drag & drop accessible au clavier en alternative (a minima un menu contextuel "Move to...").
- **Jamais d'information uniquement par la couleur** — chaque priorité/statut a aussi un label texte, pas seulement un chip coloré.

## Performance

- **Core Web Vitals** ciblés : LCP < 2.5s, CLS < 0.1 sur les pages publiques (landing, pricing).
- **Optimistic UI** sur toutes les actions de drag & drop et de mise à jour de tâche — pas d'attente serveur visible.
- **Streaming de la réponse IA** (reasoning stream) pour masquer la latence du modèle — premier token affiché en < 1.5s perçu.

## Fiabilité

- **Dégradation gracieuse du temps réel** : si Pusher est indisponible, l'app reste utilisable en mode "polling/refresh manuel", pas de blocage total de l'interface.
- **Pas de perte de données en cas de conflit** : dernière écriture gagnante avec horodatage, conflit signalé visuellement si deux utilisateurs modifient la même tâche en quasi-simultané.
