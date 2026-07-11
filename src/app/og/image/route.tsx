import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f131d",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
            borderRadius: "100%",
          }}
        />

        {/* Logo + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg fill="none" height="24" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
              <rect height="18" rx="2" width="18" x="3" y="3" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#dfe2f1",
              letterSpacing: "-0.02em",
            }}
          >
            Axiom
          </span>
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            margin: "0 0 16px 0",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "900px",
          }}
        >
          The intelligence layer
          <br />
          for elite teams.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "22px",
            color: "#c2c6d6",
            textAlign: "center",
            margin: 0,
            maxWidth: "700px",
          }}
        >
          AI-powered Kanban · Sprint Analytics · Real-time collaboration
        </p>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "100px",
            border: "1px solid rgba(139,92,246,0.3)",
            background: "rgba(139,92,246,0.08)",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "100%",
              background: "#8B5CF6",
            }}
          />
          <span style={{ fontSize: "13px", color: "#8B5CF6", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Axiom Intelligence Engine
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
