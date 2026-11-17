import { ImageResponse } from "next/og";
import { site, totalTests } from "@/lib/content";

// The card shown when the site link is shared on LinkedIn, Slack and similar.

export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ink = "#eeece6";
const muted = "#a5a299";
const accent = "#f0b351";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          backgroundColor: "#0b0c0e",
          backgroundImage: "radial-gradient(circle at 88% 0%, rgba(240,179,81,0.26), rgba(11,12,14,0) 55%)",
          color: ink,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: muted }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: accent, marginRight: 18 }} />
          {site.name} · {site.role}
        </div>

        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, lineHeight: 1.04, letterSpacing: -3 }}>
          <span>I build AI applications</span>
          <span>and the back ends that</span>
          <span style={{ display: "flex" }}>
            keep them&nbsp;<span style={{ color: accent }}>reliable.</span>
          </span>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: muted }}>
          3 projects with live demos · {totalTests} tests · 2 years at Deloitte
        </div>
      </div>
    ),
    size,
  );
}
