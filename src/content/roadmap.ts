export type RoadmapStatus = "shipped" | "in-progress" | "planned" | "considering";

// title/description live in the `roadmapItems.<id>` i18n namespace
// (messages/en.json, messages/fr.json) — keep item ids in sync with those keys.
export interface RoadmapItem {
  id: string;
  status: RoadmapStatus;
  date?: string;
}

// label/description live in the `roadmapColumns.<id>` i18n namespace.
export interface RoadmapColumn {
  id: "now" | "next" | "later";
  items: RoadmapItem[];
}

export const ROADMAP: RoadmapColumn[] = [
  {
    id: "now",
    items: [
      { id: "kanban-core", status: "shipped", date: "Jun 2026" },
      { id: "ai-intelligence", status: "shipped", date: "Jun 2026" },
      { id: "sprint-analytics", status: "shipped", date: "Jun 2026" },
      { id: "dark-light", status: "shipped", date: "Jul 2026" },
      { id: "cmd-palette", status: "shipped", date: "Jul 2026" },
      { id: "premium-redesign", status: "shipped", date: "Jul 2026" },
      { id: "workspace-lifecycle", status: "shipped", date: "Jul 2026" },
      { id: "team-management", status: "shipped", date: "Jul 2026" },
      { id: "toast-notifications", status: "shipped", date: "Jul 2026" },
      { id: "webhooks", status: "shipped", date: "Jul 2026" },
      { id: "pwa", status: "shipped", date: "Jul 2026" },
      { id: "i18n", status: "shipped", date: "Jul 2026" },
      { id: "emails", status: "shipped", date: "Jul 2026" },
      { id: "billing", status: "shipped", date: "Jul 2026" },
      { id: "audit-log", status: "shipped", date: "Jul 2026" },
    ],
  },
  {
    id: "next",
    items: [
      { id: "push-notifications", status: "planned" },
      { id: "email-expansion", status: "planned" },
    ],
  },
  {
    id: "later",
    items: [
      { id: "native-mobile", status: "considering" },
      { id: "integrations", status: "considering" },
    ],
  },
];
