import { ImageResponse } from "next/og";

export const alt = "THREADIFY — Custom T-Shirt Studio. Wear Your Point of View.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 90, background: "#F3EFE6", color: "#252820" }}>
        <div style={{ fontSize: 28, letterSpacing: 8, color: "#B87958" }}>CUSTOM T-SHIRT STUDIO</div>
        <div style={{ fontSize: 120, fontWeight: 700, marginTop: 24 }}>THREADIFY</div>
        <div style={{ fontSize: 44, marginTop: 16, color: "#667052" }}>Wear Your Point of View.</div>
        <div style={{ marginTop: 56, fontSize: 24, color: "#252820", opacity: 0.6 }}>Academic demo store — sandbox payments only</div>
      </div>
    ),
    size
  );
}
