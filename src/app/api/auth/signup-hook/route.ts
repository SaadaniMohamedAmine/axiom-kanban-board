import { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/send";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json() as { email: string; name: string };

  if (!email || !name) {
    return new Response(JSON.stringify({ error: "Missing email or name" }), { status: 400 });
  }

  void sendWelcomeEmail({ to: email, userName: name }).catch(() => {});

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
