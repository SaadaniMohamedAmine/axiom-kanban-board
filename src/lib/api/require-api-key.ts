import { NextRequest } from "next/server";
import { verifyAPIKey } from "./api-key";

export interface APIAuthContext {
  workspaceId: string;
  keyId: string;
}

export async function requireAPIKey(
  req: NextRequest
): Promise<{ context: APIAuthContext } | { error: Response }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: new Response(
        JSON.stringify({ error: "unauthorized", message: "Missing or invalid Authorization header. Use: Bearer axm_..." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const raw = authHeader.slice(7).trim();
  const { valid, workspaceId, keyId } = await verifyAPIKey(raw);

  if (!valid || !workspaceId || !keyId) {
    return {
      error: new Response(
        JSON.stringify({ error: "unauthorized", message: "Invalid or revoked API key." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { context: { workspaceId, keyId } };
}
