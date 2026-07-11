import crypto from "crypto";

const KEY_PREFIX = "axm_";

export function generateAPIKey(): { raw: string; hash: string; prefix: string } {
  const randomPart = crypto.randomBytes(32).toString("hex");
  const raw = `${KEY_PREFIX}${randomPart}`;
  const hash = hashAPIKey(raw);
  const prefix = raw.slice(0, 12);

  return { raw, hash, prefix };
}

export function hashAPIKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function verifyAPIKey(
  raw: string
): Promise<{ valid: boolean; workspaceId: string | null; keyId: string | null }> {
  if (!raw.startsWith(KEY_PREFIX)) {
    return { valid: false, workspaceId: null, keyId: null };
  }

  const hash = hashAPIKey(raw);

  const { prisma } = await import("@/lib/prisma");

  const apiKey = await prisma.aPIKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, workspaceId: true, revokedAt: true },
  });

  if (!apiKey || apiKey.revokedAt !== null) {
    return { valid: false, workspaceId: null, keyId: null };
  }

  void prisma.aPIKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { valid: true, workspaceId: apiKey.workspaceId, keyId: apiKey.id };
}
