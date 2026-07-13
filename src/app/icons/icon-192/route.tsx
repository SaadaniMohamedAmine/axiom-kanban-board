import { ImageResponse } from "next/og";
import { AxiomMark } from "@/lib/axiom-mark";

// Same runtime rationale as src/app/og/image/route.tsx — Node.js avoids the
// Edge Function bundle-size limit and isn't latency-sensitive here.
export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(<AxiomMark size={192} />, { width: 192, height: 192 });
}
