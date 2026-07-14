import { ImageResponse } from "next/og";

export const alt =
  "DocuMind — Upload PDFs and ask grounded questions with cited answers";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "radial-gradient(circle at 12% 18%, rgba(15, 118, 110, 0.22), transparent 42%), radial-gradient(circle at 88% 12%, rgba(194, 65, 12, 0.12), transparent 36%), linear-gradient(165deg, #f7f2ea 0%, #efe6d8 55%, #e7dcc8 100%)",
          color: "#1c1917",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 28,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#0f766e",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          DocuMind
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              lineHeight: 1.05,
              fontWeight: 700,
              maxWidth: 920,
            }}
          >
            <span>Ask your PDFs.</span>
            <span style={{ color: "#0f766e" }}>Get cited answers.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(28, 25, 23, 0.72)",
              maxWidth: 780,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Upload documents, ask grounded questions, and see the source chunks
            behind every answer.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 22,
            color: "rgba(28, 25, 23, 0.55)",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <span>RAG · Citations · Gemini</span>
          <span>·</span>
          <span>trydocumind.vercel.app</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
