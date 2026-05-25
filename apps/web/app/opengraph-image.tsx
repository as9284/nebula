import { ImageResponse } from "next/og";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site-metadata";

export const alt = `${SITE_NAME} — local-first AI chat`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "64px 72px",
          background:
            "linear-gradient(135deg, #252522 0%, #171714 52%, #121210 100%)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            width: 196,
            height: 196,
            borderRadius: 46,
            background: "linear-gradient(145deg, #252522, #171714)",
            border: "1px solid rgba(255,255,255,0.09)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 56,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 132,
              height: 132,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, #d8cff8 0%, #a894ee 28%, #8a78e6 52%, rgba(107,92,198,0.15) 78%, transparent 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 88,
              height: 64,
              borderRadius: "50%",
              left: 42,
              top: 72,
              background:
                "radial-gradient(ellipse, rgba(181,166,240,0.75) 0%, transparent 72%)",
            }}
          />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(180deg, #ffffff 0%, #ebe7fb 100%)",
              boxShadow: "0 0 28px rgba(216,207,248,0.75)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              color: "#e8e6e3",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 34,
              color: "#9b9a97",
              marginTop: 20,
              lineHeight: 1.35,
              maxWidth: 720,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 36,
              gap: 10,
            }}
          >
            {["Local-first", "Tasks", "Weather", "Links"].map((label) => (
              <div
                key={label}
                style={{
                  fontSize: 22,
                  color: "#d8cff8",
                  background: "rgba(138, 120, 230, 0.18)",
                  border: "1px solid rgba(138, 120, 230, 0.35)",
                  borderRadius: 999,
                  padding: "8px 18px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
