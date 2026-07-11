export type RoadmapStatus = "shipped" | "in-progress" | "planned" | "considering";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  date?: string;
}

export interface RoadmapColumn {
  id: "now" | "next" | "later";
  label: string;
  description: string;
  items: RoadmapItem[];
}

export const ROADMAP: RoadmapColumn[] = [
  {
    id: "now",
    label: "Now",
    description: "What we're shipping or just shipped",
    items: [
      {
        id: "kanban-core",
        title: "Core Kanban Board",
        description: "Drag-and-drop columns and tasks, real-time sync via Pusher Channels.",
        status: "shipped",
        date: "Jun 2026",
      },
      {
        id: "ai-intelligence",
        title: "Axiom Intelligence Engine",
        description: "AI-powered prioritization, estimation, blocker detection, and smart assignment.",
        status: "shipped",
        date: "Jun 2026",
      },
      {
        id: "sprint-analytics",
        title: "Sprint Analytics",
        description: "Burndown charts, velocity tracking, AI-generated sprint health summaries.",
        status: "shipped",
        date: "Jun 2026",
      },
      {
        id: "dark-light",
        title: "Dark & Light Mode",
        description: "Full design token system with next-themes and system preference detection.",
        status: "shipped",
        date: "Jul 2026",
      },
      {
        id: "cmd-palette",
        title: "Command Palette",
        description: "Global ⌘K search across all tasks and boards with keyboard navigation.",
        status: "shipped",
        date: "Jul 2026",
      },
    ],
  },
  {
    id: "next",
    label: "Next",
    description: "What's coming in the next 60 days",
    items: [
      {
        id: "webhooks",
        title: "Webhooks & Public API",
        description: "REST API for external integrations. Subscribe to task/column events via webhook.",
        status: "planned",
      },
      {
        id: "pwa",
        title: "Progressive Web App",
        description: "Install Axiom on desktop or mobile, work offline, get push notifications.",
        status: "planned",
      },
      {
        id: "i18n",
        title: "Internationalization",
        description: "Full French and English support with auto-detection from browser locale.",
        status: "planned",
      },
      {
        id: "emails",
        title: "Transactional Emails",
        description: "On-brand email notifications for invitations, mentions, and sprint milestones.",
        status: "planned",
      },
    ],
  },
  {
    id: "later",
    label: "Later",
    description: "Longer-term vision",
    items: [
      {
        id: "billing",
        title: "Billing & Pricing Plans",
        description: "Stripe-powered subscription with Free, Pro, and Team tiers.",
        status: "considering",
      },
      {
        id: "audit-log",
        title: "Audit Log & Compliance",
        description: "Full activity audit trail for workspace owners, exportable as CSV.",
        status: "considering",
      },
      {
        id: "native-mobile",
        title: "Native Mobile App",
        description: "React Native app with offline board access and push notifications.",
        status: "considering",
      },
      {
        id: "integrations",
        title: "GitHub / Linear Integration",
        description: "Sync tasks with GitHub Issues and Linear tickets bidirectionally.",
        status: "considering",
      },
    ],
  },
];
