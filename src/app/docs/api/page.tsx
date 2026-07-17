import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Axiom REST API documentation. Integrate Axiom into your tools.",
};

export const dynamic = "force-static";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban-board.vercel.app";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/boards",
    description: "List all boards in the authenticated workspace.",
    example: `curl -H "Authorization: Bearer axm_yourkey" \\
  ${APP_URL}/api/v1/boards`,
    response: `{
  "data": [
    { "id": "...", "name": "Product Board", "template": "KANBAN", "taskCounter": 42, ... }
  ],
  "meta": { "workspaceId": "...", "count": 1 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/boards/:boardId/tasks",
    description: "List tasks in a board. Supports pagination via ?page and ?per_page.",
    example: `curl -H "Authorization: Bearer axm_yourkey" \\
  ${APP_URL}/api/v1/boards/BOARD_ID/tasks?per_page=20`,
    response: `{
  "data": [
    { "id": "...", "code": "AX-42", "title": "...", "priority": "HIGH", ... }
  ],
  "meta": { "total": 120, "page": 1, "per_page": 20, "total_pages": 6 }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/tasks",
    description: "Create a new task in a specific board and column.",
    example: `curl -X POST -H "Authorization: Bearer axm_yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{ "boardId": "...", "columnId": "...", "title": "My task", "priority": "HIGH" }' \\
  ${APP_URL}/api/v1/tasks`,
    response: `{ "data": { "id": "...", "code": "AX-43", "title": "My task", ... } }`,
  },
  {
    method: "PATCH",
    path: "/api/v1/tasks/:taskId",
    description: "Update an existing task. All fields are optional.",
    example: `curl -X PATCH -H "Authorization: Bearer axm_yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{ "priority": "URGENT", "columnId": "done-column-id" }' \\
  ${APP_URL}/api/v1/tasks/TASK_ID`,
    response: `{ "data": { "id": "...", "priority": "URGENT", "columnId": "...", ... } }`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/10 text-green-400 border-green-500/20",
  POST: "bg-primary/10 text-primary border-primary/20",
  PATCH: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5">
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Axiom
          </Link>
          <span className="text-on-surface-variant/30">/</span>
          <span className="text-[13px] text-on-surface">API Reference</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            Developer Docs
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            API Reference
          </h1>
          <p className="text-[15px] text-on-surface-variant max-w-xl">
            Axiom provides a REST API to read and write data programmatically. All endpoints require
            an API Key generated in Settings → Developers.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Authentication</h2>
          <div className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container">
            <p className="text-[14px] text-on-surface-variant mb-3">
              Pass your API key in the <code className="font-mono text-[12px] bg-surface-container-highest px-1.5 py-0.5 rounded">Authorization</code> header:
            </p>
            <pre className="font-mono text-[13px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto">
              {`Authorization: Bearer axm_yourkey`}
            </pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Base URL</h2>
          <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container">
            <code className="font-mono text-[14px] text-primary">{APP_URL}/api/v1</code>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-on-surface mb-6">Endpoints</h2>
          <div className="space-y-8">
            {ENDPOINTS.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/20">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono border ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-[14px] font-mono text-on-surface">{ep.path}</code>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-[14px] text-on-surface-variant">{ep.description}</p>
                  <div>
                    <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-wider mb-2">Example</div>
                    <pre className="font-mono text-[12px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                      {ep.example}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-wider mb-2">Response</div>
                    <pre className="font-mono text-[12px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Verifying Webhook Signatures</h2>
          <div className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container">
            <p className="text-[14px] text-on-surface-variant mb-4">
              Each webhook request includes a <code className="font-mono text-[12px]">X-Axiom-Signature</code> header (HMAC-SHA256 of the raw body using your signing secret). Verify it server-side:
            </p>
            <pre className="font-mono text-[12px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto">{`// Node.js verification example
const crypto = require("crypto");

function verifyAxiomWebhook(rawBody, signature, secret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}`}</pre>
          </div>
        </section>
      </main>
    </div>
  );
}
