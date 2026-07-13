import { ImageResponse } from "next/og";
import { AxiomMark } from "@/lib/axiom-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AxiomMark size={32} />, size);
}
