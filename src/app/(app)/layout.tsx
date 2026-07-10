import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-[260px] bg-surface-container border-r border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <h1 className="text-h3 font-semibold text-on-surface">Axiom</h1>
        </div>
        <nav className="flex-1 p-4">
          <div className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
            Workspace
          </div>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-surface-container border-b border-outline-variant flex items-center px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-body-md text-on-surface-variant">
              {session.user.name}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
