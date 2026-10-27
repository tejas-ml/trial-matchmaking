import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f3efe4",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#1b1814",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#6a6358" }}>
          RAG · ClinicalTrials.gov · ICD-10
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, maxWidth: 900 }}>HelixMatch</div>
          <div style={{ marginTop: 18, fontSize: 32, color: "#6a6358", maxWidth: 860 }}>
            AI-powered clinical trial matching from unstructured notes.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#243f34" }}>
          Pfizer · Novartis · IQVIA · Flatiron Health
        </div>
      </div>
    ),
    size,
  );
}
