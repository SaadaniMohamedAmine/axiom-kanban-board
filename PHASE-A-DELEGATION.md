# Axiom — Phase A Delegation Document
> Version 1.0 | 2026-07-10 | Délégation complète sans retour requis

Ce document est autonome. L'assistant qui le reçoit peut implémenter les 3 features de Phase A sans poser de questions.

---

## 0. Contexte du projet

**Stack** : Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Better Auth, Prisma 7, PostgreSQL (Neon), Pusher Channels, Groq + Gemini Flash, @dnd-kit/core, Framer Motion, Zod

**Repo local** : `axiom-kanban-board/`

**Structure src existante** :
```
src/
  app/
    (app)/layout.tsx          ← sidebar + header, session check
    (app)/[workspaceSlug]/boards/[boardId]/
      page.tsx
      board-view-with-modal.tsx
    api/auth/[...all]/route.ts
  components/
    board/board-view.tsx, column.tsx, task-card.tsx
    task-detail/task-detail-modal.tsx, task-properties-panel.tsx
    sprint/sprint-panel.tsx
  lib/
    auth.ts, prisma.ts, pusher.ts, pusher-client.ts
    actions/task.actions.ts, sprint.actions.ts ...
    validations/*.schema.ts
  types/*.types.ts
```

**CSS tokens utilisés dans le projet** (classes Tailwind custom, ne pas inventer) :
`bg-surface-container`, `bg-surface-container-high`, `bg-surface-container-highest`,
`text-on-surface`, `text-on-surface-variant`, `border-outline-variant`,
`text-primary`, `bg-primary`, `text-h3`, `text-body-md`, `text-label-md`

**Icônes** : inline SVG uniquement (pas d'import lucide-react). Stroke 1.5px.

**Prisma schema** : déjà complet avec `AILog`, `Sprint`, `Task.estimate`, etc. Aucune migration nécessaire.

**Phases déjà complétées** : 001-setup, 002-core-kanban, 003-realtime-sync. Le board Kanban est fonctionnel avec drag & drop, Pusher realtime, et task-detail-modal.

---

## 1. Packages à installer

```bash
pnpm add groq-sdk @google/generative-ai recharts
```

---

## 2. Variables d'environnement à ajouter dans `.env.local` ET Vercel Dashboard

```env
# Groq (primary AI)
GROQ_API_KEY=gsk_...

# Gemini Flash (fallback AI)
GEMINI_API_KEY=AIza...

# Rate limiting (requests per user per day for AI)
AI_DAILY_LIMIT=50
```

---

## 3. Feature 004 — Axiom Intelligence

### 3.1 Tasks

- [ ] T001 — Créer `src/lib/ai/client.ts` (abstraction Groq + Gemini fallback)
- [ ] T002 — Créer `src/lib/ai/prompts.ts` (tous les prompts)
- [ ] T003 — Créer `src/lib/ai/rate-limit.ts` (rate limiter par userId)
- [ ] T004 — Créer `src/lib/validations/ai.schema.ts` (Zod schemas)
- [ ] T005 — Créer `src/types/ai.types.ts`
- [ ] T006 — Créer `src/app/api/ai/prioritize/route.ts` (streaming SSE)
- [ ] T007 — Créer `src/app/api/ai/estimate/route.ts` (streaming SSE)
- [ ] T008 — Créer `src/app/api/ai/describe/route.ts` (streaming SSE)
- [ ] T009 — Créer `src/app/api/ai/detect-blocker/route.ts` (streaming SSE)
- [ ] T010 — Créer `src/app/api/ai/assign/route.ts` (streaming SSE)
- [ ] T011 — Créer `src/lib/actions/ai.actions.ts` (feedback server action)
- [ ] T012 — Créer `src/components/ai/reasoning-stream.tsx`
- [ ] T013 — Créer `src/components/ai/feedback-buttons.tsx`
- [ ] T014 — Créer `src/components/ai/axiom-intelligence-panel.tsx`
- [ ] T015 — Modifier `src/components/task-detail/task-detail-modal.tsx` (ajouter panel IA dans la colonne droite)

### 3.2 Code complet

#### `src/types/ai.types.ts`

```typescript
export type AIEndpointType =
  | "PRIORITIZE"
  | "ESTIMATE"
  | "DESCRIBE"
  | "DETECT_BLOCKER"
  | "ASSIGN";

export interface AIStreamChunk {
  text: string;
}

export interface AIStreamDone {
  done: true;
  logId: string;
}

export interface AISuggestion {
  logId: string;
  type: AIEndpointType;
  reasoning: string;
  result: string | number | boolean;
  confidence: number;
}

export interface AIFeedbackPayload {
  logId: string;
  feedback: "USEFUL" | "NOT_USEFUL";
}
```

#### `src/lib/validations/ai.schema.ts`

```typescript
import { z } from "zod";

export const prioritizeInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  columnName: z.string().max(100),
  dueDate: z.string().datetime().optional(),
});

export const estimateInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  similarTasks: z
    .array(
      z.object({
        title: z.string(),
        estimate: z.number(),
      })
    )
    .max(10)
    .optional(),
});

export const describeInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  columnName: z.string().max(100),
});

export const detectBlockerInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  columnName: z.string().max(100),
  daysSinceLastActivity: z.number().min(0).max(365),
  commentCount: z.number().min(0),
});

export const assignInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  members: z
    .array(
      z.object({
        userId: z.string(),
        name: z.string(),
        taskCount: z.number(),
      })
    )
    .max(20),
});

export const feedbackInputSchema = z.object({
  logId: z.string().cuid(),
  feedback: z.enum(["USEFUL", "NOT_USEFUL"]),
});
```

#### `src/lib/ai/prompts.ts`

```typescript
export const PROMPTS = {
  prioritize: (
    title: string,
    description: string | undefined,
    columnName: string,
    dueDate: string | undefined
  ) => `You are Axiom Intelligence, an expert project management AI for elite engineering teams.

Analyze this task and suggest the most appropriate priority level.

Task: "${title}"
${description ? `Description: "${description}"` : "No description provided."}
Current column: "${columnName}"
${dueDate ? `Due date: ${new Date(dueDate).toLocaleDateString()}` : "No due date set."}

Priority levels: URGENT (blocking production or critical deadline within 24h), HIGH (important, needed this sprint), MEDIUM (normal priority), LOW (nice to have, no deadline pressure).

Respond with:
1. Your recommended priority: [URGENT|HIGH|MEDIUM|LOW]
2. A concise reasoning (2-3 sentences) explaining your assessment based on the task content, column status, and due date.

Be direct and factual. Do not use emojis or exclamation marks.`,

  estimate: (
    title: string,
    description: string | undefined,
    similarTasks: { title: string; estimate: number }[] | undefined
  ) => `You are Axiom Intelligence, an expert project management AI for elite engineering teams.

Estimate the story points for this task using the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21).

Task: "${title}"
${description ? `Description: "${description}"` : "No description provided."}
${
  similarTasks?.length
    ? `Similar completed tasks for reference:\n${similarTasks.map((t) => `- "${t.title}": ${t.estimate} points`).join("\n")}`
    : "No historical data available."
}

Fibonacci guide: 1=trivial (<1h), 2=simple (1-2h), 3=small (half day), 5=medium (1 day), 8=large (2-3 days), 13=very large (week), 21=epic (needs breakdown).

Respond with:
1. Recommended estimate: [number] story points
2. Concise reasoning (2-3 sentences) explaining your estimate based on scope and complexity.

Be direct and factual. Do not use emojis or exclamation marks.`,

  describe: (title: string, columnName: string) =>
    `You are Axiom Intelligence, an expert project management AI for elite engineering teams.

Generate a clear, professional task description based on this title.

Task title: "${title}"
Current column: "${columnName}"

Write a task description (3-5 sentences) that:
- Clarifies the scope and expected outcome
- Mentions key technical considerations if applicable
- States a clear definition of done
- Uses professional, direct language (no emojis, no exclamation marks)

Output only the description text, nothing else.`,

  detectBlocker: (
    title: string,
    description: string | undefined,
    columnName: string,
    daysSinceLastActivity: number,
    commentCount: number
  ) => `You are Axiom Intelligence, an expert project management AI for elite engineering teams.

Analyze whether this task is likely blocked or at risk.

Task: "${title}"
${description ? `Description: "${description}"` : "No description provided."}
Current column: "${columnName}"
Days since last activity: ${daysSinceLastActivity}
Number of comments: ${commentCount}

Signals of a blocked task: no activity for 3+ days while In Progress, many comments suggesting back-and-forth, vague description with no clear owner.

Respond with:
1. Assessment: [BLOCKED|AT_RISK|ON_TRACK]
2. Concise reasoning (2-3 sentences) explaining your assessment.

Be direct and factual. Do not use emojis or exclamation marks.`,

  assign: (
    title: string,
    description: string | undefined,
    members: { name: string; taskCount: number }[]
  ) => `You are Axiom Intelligence, an expert project management AI for elite engineering teams.

Suggest the best team member to assign this task to.

Task: "${title}"
${description ? `Description: "${description}"` : "No description provided."}

Current workload of team members:
${members.map((m) => `- ${m.name}: ${m.taskCount} active tasks`).join("\n")}

Consider workload balance as the primary factor. If the task description implies specific expertise, factor that in as a secondary consideration.

Respond with:
1. Recommended assignee: [name]
2. Concise reasoning (2 sentences) explaining your recommendation.

Be direct and factual. Do not use emojis or exclamation marks.`,
} as const;
```

#### `src/lib/ai/rate-limit.ts`

```typescript
// Simple in-memory rate limiter (per userId, resets at midnight UTC)
// For production scale: replace with Upstash Redis

interface RateLimitRecord {
  count: number;
  resetAt: number; // Unix timestamp ms
}

const store = new Map<string, RateLimitRecord>();

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "50", 10);

export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  const resetAt = midnight.getTime();

  const record = store.get(userId);

  if (!record || record.resetAt <= now) {
    store.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: DAILY_LIMIT - 1, resetAt };
  }

  if (record.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  const remaining = DAILY_LIMIT - record.count;
  return { allowed: true, remaining, resetAt: record.resetAt };
}
```

#### `src/lib/ai/client.ts`

```typescript
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

let groqClient: Groq | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return groqClient;
}

function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return geminiClient;
}

type StreamCallback = (chunk: string) => void;

export async function streamCompletion(
  prompt: string,
  onChunk: StreamCallback
): Promise<string> {
  // Try Groq first
  try {
    const groq = getGroq();
    const stream = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      stream: true,
      max_tokens: 512,
      temperature: 0.3,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (groqError) {
    // Groq failed (quota/rate limit) — fall back to Gemini Flash
    console.warn("[Axiom AI] Groq failed, falling back to Gemini:", groqError);
  }

  // Gemini Flash fallback (streaming)
  const gemini = getGemini();
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContentStream(prompt);

  let fullText = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
}
```

#### Route handler pattern (applies to all 5 endpoints)

**`src/app/api/ai/prioritize/route.ts`**

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { streamCompletion } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { prioritizeInputSchema } from "@/lib/validations/ai.schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // 2. Rate limit
  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "Axiom Intelligence daily limit reached. Resets at midnight UTC.",
        resetAt: rateLimit.resetAt,
      }),
      { status: 429 }
    );
  }

  // 3. Validate input
  const body = await req.json().catch(() => null);
  const parsed = prioritizeInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  const { taskId, title, description, columnName, dueDate } = parsed.data;

  // 4. Verify task belongs to user's workspace (workspaceId scoping)
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      board: {
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    },
  });
  if (!task) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
    });
  }

  // 5. Stream response with SSE
  let savedLogId: string | null = null;
  let fullOutput = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const prompt = PROMPTS.prioritize(title, description, columnName, dueDate);

        fullOutput = await streamCompletion(prompt, (chunk) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        });

        // Parse result from output for storage
        const priorityMatch = fullOutput.match(/\b(URGENT|HIGH|MEDIUM|LOW)\b/);
        const priority = priorityMatch?.[1] ?? "MEDIUM";

        // Persist AILog
        const log = await prisma.aILog.create({
          data: {
            taskId,
            type: "PRIORITIZE",
            input: { title, description, columnName, dueDate },
            output: { reasoning: fullOutput, result: priority },
            confidence: 0.8,
          },
        });
        savedLogId = log.id;

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, logId: log.id })}\n\n`
          )
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Axiom Intelligence encountered an error." })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
```

**`src/app/api/ai/estimate/route.ts`**

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { streamCompletion } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { estimateInputSchema } from "@/lib/validations/ai.schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Axiom Intelligence daily limit reached.", resetAt: rateLimit.resetAt }), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = estimateInputSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });

  const { taskId, title, description, similarTasks } = parsed.data;

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { workspace: { members: { some: { userId: session.user.id } } } } },
  });
  if (!task) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const prompt = PROMPTS.estimate(title, description, similarTasks);
        const fullOutput = await streamCompletion(prompt, (chunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        });

        const estimateMatch = fullOutput.match(/\b(1|2|3|5|8|13|21)\b/);
        const estimate = estimateMatch ? parseInt(estimateMatch[1]) : 3;

        const log = await prisma.aILog.create({
          data: {
            taskId,
            type: "ESTIMATE",
            input: { title, description, similarTasks },
            output: { reasoning: fullOutput, result: estimate },
            confidence: 0.75,
          },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, logId: log.id })}\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Axiom Intelligence encountered an error." })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
```

**`src/app/api/ai/describe/route.ts`**

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { streamCompletion } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { describeInputSchema } from "@/lib/validations/ai.schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Axiom Intelligence daily limit reached.", resetAt: rateLimit.resetAt }), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = describeInputSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });

  const { taskId, title, columnName } = parsed.data;

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { workspace: { members: { some: { userId: session.user.id } } } } },
  });
  if (!task) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const prompt = PROMPTS.describe(title, columnName);
        const fullOutput = await streamCompletion(prompt, (chunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        });

        const log = await prisma.aILog.create({
          data: {
            taskId,
            type: "DESCRIBE",
            input: { title, columnName },
            output: { reasoning: "", result: fullOutput },
            confidence: 0.85,
          },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, logId: log.id })}\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Axiom Intelligence encountered an error." })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
```

**`src/app/api/ai/detect-blocker/route.ts`**

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { streamCompletion } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { detectBlockerInputSchema } from "@/lib/validations/ai.schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Axiom Intelligence daily limit reached.", resetAt: rateLimit.resetAt }), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = detectBlockerInputSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });

  const { taskId, title, description, columnName, daysSinceLastActivity, commentCount } = parsed.data;

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { workspace: { members: { some: { userId: session.user.id } } } } },
  });
  if (!task) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const prompt = PROMPTS.detectBlocker(title, description, columnName, daysSinceLastActivity, commentCount);
        const fullOutput = await streamCompletion(prompt, (chunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        });

        const statusMatch = fullOutput.match(/\b(BLOCKED|AT_RISK|ON_TRACK)\b/);
        const result = statusMatch?.[1] ?? "ON_TRACK";

        const log = await prisma.aILog.create({
          data: {
            taskId,
            type: "DETECT_BLOCKER",
            input: { title, description, columnName, daysSinceLastActivity, commentCount },
            output: { reasoning: fullOutput, result },
            confidence: 0.7,
          },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, logId: log.id })}\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Axiom Intelligence encountered an error." })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
```

**`src/app/api/ai/assign/route.ts`**

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { streamCompletion } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { assignInputSchema } from "@/lib/validations/ai.schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Axiom Intelligence daily limit reached.", resetAt: rateLimit.resetAt }), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = assignInputSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });

  const { taskId, title, description, members } = parsed.data;

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { workspace: { members: { some: { userId: session.user.id } } } } },
  });
  if (!task) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const prompt = PROMPTS.assign(title, description, members);
        const fullOutput = await streamCompletion(prompt, (chunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        });

        const log = await prisma.aILog.create({
          data: {
            taskId,
            type: "ASSIGN",
            input: { title, description, members },
            output: { reasoning: fullOutput, result: fullOutput.split("\n")[0] ?? "" },
            confidence: 0.72,
          },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, logId: log.id })}\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Axiom Intelligence encountered an error." })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
```

#### `src/lib/actions/ai.actions.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { feedbackInputSchema } from "@/lib/validations/ai.schema";

export async function submitAIFeedback(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const { logId, feedback } = parsed.data;

  // Verify the AILog belongs to user's workspace
  const log = await prisma.aILog.findFirst({
    where: {
      id: logId,
      task: {
        board: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
    },
  });

  if (!log) throw new Error("Log not found");

  await prisma.aILog.update({
    where: { id: logId },
    data: { feedback },
  });
}
```

#### `src/components/ai/reasoning-stream.tsx`

```typescript
"use client";

import { useEffect, useRef, useState } from "react";

interface ReasoningStreamProps {
  endpoint: string;
  payload: Record<string, unknown>;
  onDone?: (logId: string) => void;
  onError?: (message: string) => void;
  autoStart?: boolean;
}

export function ReasoningStream({
  endpoint,
  payload,
  onDone,
  onError,
  autoStart = false,
}: ReasoningStreamProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function startStream() {
    if (status === "streaming") return;
    setText("");
    setStatus("streaming");
    setErrorMsg("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      if (res.status === 429) {
        const data = await res.json() as { error: string };
        setErrorMsg(data.error);
        setStatus("error");
        onError?.(data.error);
        return;
      }

      if (!res.ok || !res.body) {
        setErrorMsg("Axiom Intelligence encountered an error.");
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw) as {
              text?: string;
              done?: boolean;
              logId?: string;
              error?: string;
            };

            if (parsed.error) {
              setErrorMsg(parsed.error);
              setStatus("error");
              onError?.(parsed.error);
              return;
            }

            if (parsed.text) {
              setText((prev) => prev + parsed.text);
            }

            if (parsed.done && parsed.logId) {
              setStatus("done");
              onDone?.(parsed.logId);
              return;
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }

      setStatus("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMsg("Connection lost. Please retry.");
        setStatus("error");
      }
    }
  }

  useEffect(() => {
    if (autoStart) {
      void startStream();
    }
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="space-y-3">
      {status === "idle" && (
        <button
          onClick={() => void startStream()}
          className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#8B5CF6] border border-[#8B5CF6]/30 rounded-lg hover:bg-[#8B5CF6]/10 transition-colors"
        >
          <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run analysis
        </button>
      )}

      {(status === "streaming" || status === "done") && text && (
        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#8B5CF6] to-[#22D3EE] rounded-full" />
          <p className="text-[13px] leading-relaxed text-on-surface-variant pl-2 whitespace-pre-wrap">
            {text}
            {status === "streaming" && (
              <span className="inline-block w-[2px] h-[14px] bg-[#8B5CF6] ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {errorMsg}
        </div>
      )}

      {status === "done" && (
        <button
          onClick={() => void startStream()}
          className="text-[12px] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          Regenerate
        </button>
      )}
    </div>
  );
}
```

#### `src/components/ai/feedback-buttons.tsx`

```typescript
"use client";

import { useState } from "react";
import { submitAIFeedback } from "@/lib/actions/ai.actions";

interface FeedbackButtonsProps {
  logId: string;
}

export function FeedbackButtons({ logId }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<"USEFUL" | "NOT_USEFUL" | null>(null);
  const [pending, setPending] = useState(false);

  async function handleFeedback(feedback: "USEFUL" | "NOT_USEFUL") {
    if (submitted || pending) return;
    setPending(true);
    try {
      await submitAIFeedback({ logId, feedback });
      setSubmitted(feedback);
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <span className="text-[11px] text-on-surface-variant/50">
        Feedback recorded
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-on-surface-variant/50">Helpful?</span>
      <button
        onClick={() => void handleFeedback("USEFUL")}
        disabled={pending}
        className="p-1 rounded hover:bg-green-500/10 text-on-surface-variant hover:text-green-400 transition-colors disabled:opacity-40"
        aria-label="Useful"
      >
        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </button>
      <button
        onClick={() => void handleFeedback("NOT_USEFUL")}
        disabled={pending}
        className="p-1 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-colors disabled:opacity-40"
        aria-label="Not useful"
      >
        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
      </button>
    </div>
  );
}
```

#### `src/components/ai/axiom-intelligence-panel.tsx`

```typescript
"use client";

import { useState } from "react";
import { ReasoningStream } from "./reasoning-stream";
import { FeedbackButtons } from "./feedback-buttons";
import type { TaskWithRelations } from "@/types/task.types";

interface AxiomIntelligencePanelProps {
  task: TaskWithRelations;
  boardMembers: { userId: string; name: string; taskCount: number }[];
}

type SuggestionType = "prioritize" | "estimate" | "describe" | "detect-blocker" | "assign";

interface ActiveSuggestion {
  type: SuggestionType;
  logId: string | null;
}

const SUGGESTION_ITEMS: {
  type: SuggestionType;
  label: string;
  description: string;
}[] = [
  { type: "prioritize", label: "Suggest priority", description: "Analyze and recommend the right priority level." },
  { type: "estimate", label: "Estimate effort", description: "Suggest story points based on task scope." },
  { type: "describe", label: "Generate description", description: "Write a professional task description from the title." },
  { type: "detect-blocker", label: "Detect blocker", description: "Assess whether this task may be blocked or at risk." },
  { type: "assign", label: "Suggest assignee", description: "Recommend the best team member based on workload." },
];

export function AxiomIntelligencePanel({
  task,
  boardMembers,
}: AxiomIntelligencePanelProps) {
  const [active, setActive] = useState<ActiveSuggestion | null>(null);

  function getPayload(type: SuggestionType): Record<string, unknown> {
    const base = {
      taskId: task.id,
      title: task.title,
      description: task.description ?? undefined,
    };

    switch (type) {
      case "prioritize":
        return {
          ...base,
          columnName: task.column?.name ?? "Unknown",
          dueDate: task.dueDate?.toISOString(),
        };
      case "estimate":
        return { ...base };
      case "describe":
        return { ...base, columnName: task.column?.name ?? "Unknown" };
      case "detect-blocker": {
        const lastActivity = task.activity?.[0]?.createdAt;
        const daysSince = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
          : 0;
        return {
          ...base,
          columnName: task.column?.name ?? "Unknown",
          daysSinceLastActivity: daysSince,
          commentCount: task.comments?.length ?? 0,
        };
      }
      case "assign":
        return { ...base, members: boardMembers };
    }
  }

  return (
    <div className="mt-6 border-t border-outline-variant/20 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
        <span className="text-[11px] font-semibold text-[#8B5CF6] uppercase tracking-widest">
          Axiom Intelligence
        </span>
      </div>

      {/* Suggestion buttons */}
      <div className="space-y-2">
        {SUGGESTION_ITEMS.map((item) => {
          const isActive = active?.type === item.type;
          return (
            <div key={item.type} className="rounded-lg border border-outline-variant/20 overflow-hidden">
              <button
                onClick={() => {
                  if (isActive) {
                    setActive(null);
                  } else {
                    setActive({ type: item.type, logId: null });
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#8B5CF6]/5 transition-colors"
              >
                <div>
                  <div className="text-[13px] font-medium text-on-surface">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-on-surface-variant/60 mt-0.5">
                    {item.description}
                  </div>
                </div>
                <svg
                  className={`shrink-0 ml-2 text-on-surface-variant/40 transition-transform ${isActive ? "rotate-180" : ""}`}
                  fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isActive && (
                <div className="px-3 pb-3 pt-1 bg-black/20">
                  <ReasoningStream
                    key={`${item.type}-${task.id}`}
                    endpoint={`/api/ai/${item.type}`}
                    payload={getPayload(item.type)}
                    onDone={(logId) => setActive({ type: item.type, logId })}
                    autoStart
                  />
                  {active.logId && (
                    <div className="mt-2 pt-2 border-t border-outline-variant/10">
                      <FeedbackButtons logId={active.logId} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-on-surface-variant/30 text-center">
        Axiom AI Intelligence Engine v0.1
      </p>
    </div>
  );
}
```

#### Modification de `src/components/task-detail/task-detail-modal.tsx`

Ajouter dans la section `<aside>` (Right Column — Properties), **après** `<TaskPropertiesPanel>` :

```typescript
// 1. Importer en haut du fichier
import { AxiomIntelligencePanel } from "@/components/ai/axiom-intelligence-panel";

// 2. Ajouter boardMembers comme prop
interface TaskDetailModalProps {
  task: TaskWithRelations;
  onClose: () => void;
  canEdit: boolean;
  boardMembers: { userId: string; name: string; taskCount: number }[]; // ← NOUVEAU
}

// 3. Dans le JSX, après <TaskPropertiesPanel task={task} canEdit={canEdit} />
<AxiomIntelligencePanel task={task} boardMembers={boardMembers} />
```

Dans la page `src/app/(app)/[workspaceSlug]/boards/[boardId]/board-view-with-modal.tsx`, passer `boardMembers` au modal. Les membres du board sont déjà disponibles via la page parent — ajouter la query Prisma si nécessaire :

```typescript
// Dans le Server Component page.tsx qui charge le board :
const boardMembers = await prisma.workspaceMember.findMany({
  where: { workspaceId: board.workspaceId },
  include: {
    user: { select: { id: true, name: true } },
  },
});

// Calculer taskCount par userId
const taskCounts = await prisma.taskAssignee.groupBy({
  by: ["userId"],
  where: {
    task: {
      boardId,
      column: { board: { workspaceId: board.workspaceId } },
    },
  },
  _count: { taskId: true },
});

const membersWithCount = boardMembers.map((m) => ({
  userId: m.userId,
  name: m.user.name,
  taskCount: taskCounts.find((t) => t.userId === m.userId)?._count.taskId ?? 0,
}));
```

---

## 4. Feature 005 — Analytics & Sprints

### 4.1 Tasks

- [ ] T016 — Créer `src/lib/analytics/calculations.ts` (burndown + velocity)
- [ ] T017 — Créer `src/components/analytics/burndown-chart.tsx`
- [ ] T018 — Créer `src/components/analytics/velocity-chart.tsx`
- [ ] T019 — Créer `src/components/analytics/sprint-health-summary.tsx`
- [ ] T020 — Créer `src/components/analytics/analytics-empty-state.tsx`
- [ ] T021 — Créer `src/app/(app)/[workspaceSlug]/boards/[boardId]/analytics/page.tsx`
- [ ] T022 — Modifier `src/app/(app)/layout.tsx` (ajouter lien Analytics dans la nav board)

### 4.2 Code complet

#### `src/lib/analytics/calculations.ts`

```typescript
import type { Sprint, Task } from "@prisma/client";

interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
}

interface VelocityPoint {
  sprint: string;
  points: number;
}

function getDaysBetween(a: Date, b: Date): number {
  return Math.max(
    1,
    Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function calculateBurndown(
  sprint: Sprint,
  tasks: (Task & { completedAt?: Date | null })[]
): BurndownPoint[] {
  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.estimate ?? 1), 0);

  if (totalPoints === 0) return [];

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const today = new Date();
  const effectiveEnd = today < end ? today : end;

  const totalDays = getDaysBetween(start, end);
  const data: BurndownPoint[] = [];
  let remaining = totalPoints;

  const d = new Date(start);
  let dayIndex = 0;

  while (d <= effectiveEnd) {
    const dayStr = d.toISOString().slice(0, 10);

    // Tasks completed on this specific day (use ActivityEvent STATUS_CHANGE to DONE as proxy)
    // For simplicity: tasks whose column is the last column and updatedAt matches this day
    // This requires passing completed tasks with their completedAt date
    const completedOnDay = sprintTasks.filter((t) => {
      if (!t.completedAt) return false;
      return t.completedAt.toISOString().slice(0, 10) === dayStr;
    });

    remaining = Math.max(
      0,
      remaining - completedOnDay.reduce((s, t) => s + (t.estimate ?? 1), 0)
    );

    const ideal = Math.max(
      0,
      totalPoints - (totalPoints / totalDays) * dayIndex
    );

    data.push({
      date: d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
      remaining,
      ideal: Math.round(ideal * 10) / 10,
    });

    d.setDate(d.getDate() + 1);
    dayIndex++;
  }

  return data;
}

export function calculateVelocity(
  sprints: (Sprint & { tasks: Task[] })[]
): VelocityPoint[] {
  return sprints
    .filter((s) => s.status === "COMPLETED")
    .slice(-6) // last 6 sprints
    .map((s) => ({
      sprint: s.name,
      points: s.tasks
        .filter((t) => t.sprintId === s.id)
        .reduce((sum, t) => sum + (t.estimate ?? 1), 0),
    }));
}
```

#### `src/components/analytics/burndown-chart.tsx`

```typescript
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
}

interface BurndownChartProps {
  data: BurndownPoint[];
  sprintName: string;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0F1626",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#A8B3CF",
};

export function BurndownChart({ data, sprintName }: BurndownChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-[13px] text-on-surface-variant/50">
        No data for this sprint yet.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[13px] font-medium text-on-surface-variant mb-4">
        Burndown — {sprintName}
      </h3>
      <ResponsiveContainer height={280} width="100%">
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
            label={{ value: "Points", angle: -90, position: "insideLeft", fill: "#6B7A99", fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#6B7A99", paddingTop: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="remaining"
            name="Remaining"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6" }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            name="Ideal"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### `src/components/analytics/velocity-chart.tsx`

```typescript
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VelocityPoint {
  sprint: string;
  points: number;
}

interface VelocityChartProps {
  data: VelocityPoint[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0F1626",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#A8B3CF",
};

export function VelocityChart({ data }: VelocityChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-[13px] text-on-surface-variant/50">
        No completed sprints yet.
      </div>
    );
  }

  const avg = data.reduce((s, d) => s + d.points, 0) / data.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium text-on-surface-variant">
          Velocity (last {data.length} sprints)
        </h3>
        <span className="text-[12px] text-on-surface-variant/60">
          Avg {Math.round(avg)} pts/sprint
        </span>
      </div>
      <ResponsiveContainer height={220} width="100%">
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis
            dataKey="sprint"
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="points" name="Story Points" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### `src/components/analytics/sprint-health-summary.tsx`

```typescript
"use client";

import { useState } from "react";
import { ReasoningStream } from "@/components/ai/reasoning-stream";

interface SprintHealthSummaryProps {
  boardId: string;
  sprintId: string;
  sprintName: string;
  overdueTasks: number;
  blockedTasks: number;
  totalTasks: number;
  completedTasks: number;
}

export function SprintHealthSummary({
  boardId,
  sprintId,
  sprintName,
  overdueTasks,
  blockedTasks,
  totalTasks,
  completedTasks,
}: SprintHealthSummaryProps) {
  const [started, setStarted] = useState(false);

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-black/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_6px_#22D3EE]" />
        <span className="text-[11px] font-semibold text-[#22D3EE] uppercase tracking-widest">
          Sprint Health
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-on-surface">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-[11px] text-on-surface-variant/60">Tasks done</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-semibold ${overdueTasks > 0 ? "text-amber-400" : "text-on-surface"}`}>
            {overdueTasks}
          </div>
          <div className="text-[11px] text-on-surface-variant/60">Overdue</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-semibold ${blockedTasks > 0 ? "text-red-400" : "text-on-surface"}`}>
            {blockedTasks}
          </div>
          <div className="text-[11px] text-on-surface-variant/60">Blocked</div>
        </div>
      </div>

      <div className="border-t border-outline-variant/10 pt-3">
        <p className="text-[12px] text-on-surface-variant/60 mb-2">
          Axiom Intelligence — Sprint summary
        </p>
        {!started ? (
          <button
            onClick={() => setStarted(true)}
            className="text-[12px] text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors"
          >
            Generate AI health summary →
          </button>
        ) : (
          <ReasoningStream
            key={sprintId}
            endpoint="/api/ai/prioritize"
            payload={{
              taskId: "sprint-health",
              title: `Sprint ${sprintName} health check`,
              description: `${completedTasks}/${totalTasks} tasks done, ${overdueTasks} overdue, ${blockedTasks} blocked.`,
              columnName: "Sprint",
            }}
            autoStart
          />
        )}
      </div>
    </div>
  );
}
```

#### `src/components/analytics/analytics-empty-state.tsx`

```typescript
export function AnalyticsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-4">
        <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24" className="text-on-surface-variant/40">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      </div>
      <p className="text-[14px] text-on-surface-variant">No active sprint found.</p>
      <p className="text-[12px] text-on-surface-variant/50 mt-1">
        Start a sprint to see burndown and velocity data.
      </p>
    </div>
  );
}
```

#### `src/app/(app)/[workspaceSlug]/boards/[boardId]/analytics/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { BurndownChart } from "@/components/analytics/burndown-chart";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { SprintHealthSummary } from "@/components/analytics/sprint-health-summary";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { calculateBurndown, calculateVelocity } from "@/lib/analytics/calculations";

interface Props {
  params: Promise<{ workspaceSlug: string; boardId: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const { workspaceSlug, boardId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // workspaceId scoping
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: {
        slug: workspaceSlug,
        members: { some: { userId: session.user.id } },
      },
    },
    include: { workspace: true },
  });

  if (!board) notFound();

  // Load sprints with tasks
  const sprints = await prisma.sprint.findMany({
    where: { boardId },
    include: {
      tasks: {
        select: { id: true, estimate: true, sprintId: true, dueDate: true, columnId: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");

  // For burndown: load tasks with last STATUS_CHANGE activity
  const tasksWithActivity = activeSprint
    ? await prisma.task.findMany({
        where: { sprintId: activeSprint.id },
        include: {
          activity: {
            where: { type: "STATUS_CHANGE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      })
    : [];

  // Derive completedAt from last activity (STATUS_CHANGE to Done column)
  const lastColumns = await prisma.column.findMany({
    where: { boardId },
    orderBy: { order: "desc" },
    take: 1,
  });
  const doneColumnId = lastColumns[0]?.id;

  const tasksForBurndown = tasksWithActivity.map((t) => ({
    ...t,
    completedAt:
      t.columnId === doneColumnId && t.activity[0]
        ? t.activity[0].createdAt
        : null,
  }));

  const burndownData = activeSprint
    ? calculateBurndown(activeSprint, tasksForBurndown)
    : [];

  const velocityData = calculateVelocity(
    sprints.map((s) => ({ ...s, tasks: s.tasks }))
  );

  // Sprint health stats
  const now = new Date();
  const overdueTasks = activeSprint
    ? tasksWithActivity.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          t.columnId !== doneColumnId
      ).length
    : 0;

  const completedTasks = activeSprint
    ? tasksWithActivity.filter((t) => t.columnId === doneColumnId).length
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          {board.name}
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Analytics</h1>
      </div>

      {!activeSprint && velocityData.length === 0 ? (
        <AnalyticsEmptyState />
      ) : (
        <div className="space-y-8">
          {/* Sprint Health */}
          {activeSprint && (
            <SprintHealthSummary
              boardId={boardId}
              sprintId={activeSprint.id}
              sprintName={activeSprint.name}
              overdueTasks={overdueTasks}
              blockedTasks={0}
              totalTasks={tasksWithActivity.length}
              completedTasks={completedTasks}
            />
          )}

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
              {activeSprint ? (
                <BurndownChart data={burndownData} sprintName={activeSprint.name} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[13px] text-on-surface-variant/50">
                  No active sprint.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
              <VelocityChart data={velocityData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Modifier `src/app/(app)/layout.tsx`

Ajouter le lien Analytics dans la liste des boards. Remplacer le bloc `{membership.workspace.boards.map(...)}` :

```typescript
{membership.workspace.boards.map((board) => (
  <div key={board.id}>
    <Link
      href={`/${membership.workspace.slug}/boards/${board.id}`}
      className="flex items-center gap-2 px-3 py-1.5 text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
    >
      {/* existing board SVG icon */}
      {board.name}
    </Link>
    <Link
      href={`/${membership.workspace.slug}/boards/${board.id}/analytics`}
      className="flex items-center gap-2 pl-7 pr-3 py-1 text-[12px] text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-container-high rounded transition-colors"
    >
      <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="12">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
      Analytics
    </Link>
  </div>
))}
```

---

## 5. Feature 006 — Responsive Mobile

### 5.1 Tasks

- [ ] T023 — Créer `src/components/layout/mobile-sidebar.tsx`
- [ ] T024 — Créer `src/components/board/move-to-menu.tsx`
- [ ] T025 — Modifier `src/app/(app)/layout.tsx` (sidebar responsive + mobile header)
- [ ] T026 — Modifier `src/components/board/board-view.tsx` (touch sensors + mobile scroll)
- [ ] T027 — Modifier `src/components/board/task-card.tsx` (tap targets mobile)
- [ ] T028 — Modifier `src/components/task-detail/task-detail-modal.tsx` (fullscreen on mobile)

### 5.2 Code complet

#### `src/components/layout/mobile-sidebar.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MobileSidebarProps {
  memberships: {
    workspace: {
      id: string;
      name: string;
      slug: string;
      boards: { id: string; name: string }[];
    };
  }[];
  userName: string;
}

export function MobileSidebar({ memberships, userName }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, []);

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden h-14 bg-surface-container border-b border-outline-variant flex items-center px-4 gap-3 sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
          aria-label="Open menu"
        >
          <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <span className="text-[16px] font-semibold text-on-surface">Axiom</span>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface-container border-r border-outline-variant z-50 flex flex-col transform transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-outline-variant flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-on-surface">Axiom</h1>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
          >
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
            Workspaces
          </div>
          {memberships.map((m) => (
            <div key={m.workspace.id} className="mb-4">
              <Link
                href={`/${m.workspace.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
              >
                {m.workspace.name}
              </Link>
              <div className="ml-4 mt-1 space-y-1">
                {m.workspace.boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/${m.workspace.slug}/boards/${board.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                  >
                    {board.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-outline-variant">
          <div className="text-[13px] text-on-surface-variant px-3 py-2">
            {userName}
          </div>
        </div>
      </aside>
    </>
  );
}
```

#### `src/components/board/move-to-menu.tsx`

```typescript
"use client";

import { useState, useTransition } from "react";
import { moveTask } from "@/lib/actions/task.actions";

interface MoveToMenuProps {
  taskId: string;
  currentColumnId: string;
  columns: { id: string; name: string }[];
  onMoved?: () => void;
}

export function MoveToMenu({
  taskId,
  currentColumnId,
  columns,
  onMoved,
}: MoveToMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const otherColumns = columns.filter((c) => c.id !== currentColumnId);

  function handleMove(targetColumnId: string) {
    setOpen(false);
    startTransition(async () => {
      await moveTask({
        taskId,
        targetColumnId,
        order: 9999, // append to end
        sourceColumnId: currentColumnId,
      });
      onMoved?.();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 text-[12px] text-on-surface-variant border border-outline-variant rounded-lg px-3 py-1.5 hover:bg-surface-container-high transition-colors disabled:opacity-50"
      >
        <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="12">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
        Move to...
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-44 bg-surface-container-highest border border-outline-variant rounded-lg shadow-xl z-20 overflow-hidden">
            {otherColumns.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-on-surface-variant/60">
                No other columns
              </div>
            ) : (
              otherColumns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleMove(col.id)}
                  className="w-full text-left px-3 py-2.5 text-[13px] text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {col.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

#### Modifications `src/app/(app)/layout.tsx`

**Changements à apporter** (remplacer le return entier) :

```typescript
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

// Dans le return, remplacer par :
return (
  <div className="flex h-screen bg-background">
    {/* Desktop sidebar — masqué sur mobile */}
    <aside className="hidden md:flex w-[260px] bg-surface-container border-r border-outline-variant flex-col">
      {/* ...contenu existant de la sidebar... */}
    </aside>

    {/* Mobile sidebar (drawer) */}
    <MobileSidebar memberships={memberships} userName={session.user.name} />

    {/* Main content */}
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Desktop header — masqué sur mobile (le mobile header est dans MobileSidebar) */}
      <header className="hidden md:flex h-16 bg-surface-container border-b border-outline-variant items-center px-6">
        <div className="flex-1" />
        <span className="text-body-md text-on-surface-variant">
          {session.user.name}
        </span>
      </header>
      <div className="flex-1 overflow-auto">{children}</div>
    </main>
  </div>
);
```

#### Modifications `src/components/board/board-view.tsx`

**Ajouter TouchSensor** au DnD (2 changements) :

```typescript
// 1. Importer TouchSensor
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  KeyboardSensor, PointerSensor, TouchSensor, // ← ajouter TouchSensor
  useSensor, useSensors
} from "@dnd-kit/core";

// 2. Remplacer useSensors :
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }, // hold 250ms avant de drag sur touch
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

**Wrapper le board en scroll horizontal sur mobile** — dans le JSX, remplacer le container principal des colonnes :

```typescript
// Remplacer le div wrapper des colonnes par :
<div className="flex gap-3 p-6 overflow-x-auto snap-x snap-mandatory md:overflow-x-visible min-h-0 flex-1">
  {optimisticColumns.map((column) => (
    <div key={column.id} className="snap-center shrink-0 w-[300px] md:w-auto md:shrink md:flex-1">
      <Column
        column={column}
        tasks={column.tasks}
        onTaskClick={onTaskClick}
        canEdit={canEdit}
      />
    </div>
  ))}
</div>
```

#### Modifications `src/components/task-detail/task-detail-modal.tsx`

**Fullscreen sur mobile** — modifier le container principal :

```typescript
// Remplacer :
// <main className="relative z-10 w-full max-w-5xl bg-surface-container-high/85 ...">

// Par :
<main className="relative z-10 w-full md:max-w-5xl bg-surface-container-high md:bg-surface-container-high/85 backdrop-blur-xl border-0 md:border border-outline-variant rounded-none md:rounded-2xl overflow-hidden flex flex-col h-[100dvh] md:h-[85vh] md:max-h-[800px] shadow-2xl">
```

**Layout deux colonnes → une colonne sur mobile** :

```typescript
// Remplacer :
// <div className="flex-1 flex overflow-hidden">
//   <section className="flex-1 overflow-y-auto p-8 ...">
//   <aside className="w-[340px] ...">

// Par :
<div className="flex-1 flex flex-col md:flex-row overflow-hidden">
  <section className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 border-b md:border-b-0 border-r-0 md:border-r border-outline-variant/20">
    {/* ...contenu existant... */}
  </section>
  <aside className="w-full md:w-[340px] bg-black/20 p-5 md:p-6 overflow-y-auto">
    {/* ...contenu existant... */}
  </aside>
</div>
```

---

## 6. Checklist de validation finale

Avant de merger chaque feature branch :

```bash
pnpm build          # doit passer sans erreur
pnpm lint           # zéro warning ESLint
pnpm type-check     # zéro erreur TypeScript
```

- [ ] Aucune occurrence de `"AI Assistant"` ou `"AI Insights"` dans le code UI
- [ ] Aucune occurrence de `"any"` sans commentaire justificatif
- [ ] Chaque endpoint `/api/ai/*` retourne 401 si non authentifié
- [ ] Chaque endpoint `/api/ai/*` retourne 429 si rate limit dépassé
- [ ] `workspaceId` scope vérifié sur chaque query Prisma touchant des données utilisateur
- [ ] `recharts` et `groq-sdk` et `@google/generative-ai` dans `package.json`
- [ ] Variables d'env `GROQ_API_KEY`, `GEMINI_API_KEY`, `AI_DAILY_LIMIT` définies dans `.env.local` ET Vercel
- [ ] Board Kanban scrollable horizontalement sur viewport 375px sans overflow involontaire
- [ ] Task detail modal fullscreen sur mobile (pas de modal rognée)
- [ ] `PROGRESS.md` mis à jour après chaque merge

---

## 7. Ordre d'exécution recommandé

```
git checkout main && git pull
git checkout -b feat-004-axiom-intelligence

# → implémenter T001 à T015
# → pnpm build && pnpm lint && pnpm type-check
# → PR + squash merge

git checkout main && git pull
git checkout -b feat-005-analytics-sprints

# → implémenter T016 à T022
# → pnpm build && pnpm lint && pnpm type-check
# → PR + squash merge

git checkout main && git pull
git checkout -b feat-006-responsive-mobile

# → implémenter T023 à T028
# → pnpm build && pnpm lint && pnpm type-check
# → PR + squash merge
```

Chaque feature est indépendante. 004 peut commencer immédiatement. 005 dépend uniquement du schema Prisma (déjà complet). 006 modifie des composants existants et peut être implémentée en parallèle de 004/005.
