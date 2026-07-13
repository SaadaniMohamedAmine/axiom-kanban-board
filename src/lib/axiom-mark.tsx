/** Shared glyph for favicon/app-icon generation via `ImageResponse` (Satori). */
export function AxiomMark({ size }: { size: number }) {
  const radius = size * 0.24;
  const borderWidth = Math.max(1, Math.round(size * 0.025));
  const fontSize = size * 0.32;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "#0a0e18",
        border: `${borderWidth}px solid #3B82F6`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(size >= 128 ? { boxShadow: "0 0 40px rgba(59,130,246,0.45)" } : {}),
      }}
    >
      <span
        style={{
          fontSize,
          fontWeight: 800,
          color: "#3B82F6",
          letterSpacing: "-0.02em",
        }}
      >
        AX
      </span>
    </div>
  );
}
