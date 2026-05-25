/** Shared app-icon artwork for ImageResponse (favicon, PWA, Apple touch). */
export function createAppIconImage(options?: { maskable?: boolean }) {
  const maskable = options?.maskable ?? false;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #252522 0%, #171714 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: maskable ? "14%" : "8%",
          borderRadius: maskable ? "28%" : "22%",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: maskable ? "58%" : "68%",
          height: maskable ? "58%" : "68%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #d8cff8 0%, #a894ee 24%, #8a78e6 48%, rgba(107,92,198,0.2) 72%, transparent 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: maskable ? "44%" : "52%",
          height: maskable ? "32%" : "38%",
          borderRadius: "50%",
          left: maskable ? "22%" : "18%",
          top: maskable ? "34%" : "30%",
          background:
            "radial-gradient(ellipse, rgba(181,166,240,0.8) 0%, transparent 72%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: maskable ? "36%" : "42%",
          height: maskable ? "28%" : "32%",
          borderRadius: "50%",
          right: maskable ? "18%" : "14%",
          top: maskable ? "24%" : "20%",
          background:
            "radial-gradient(ellipse, rgba(125,109,216,0.55) 0%, transparent 72%)",
        }}
      />

      <div
        style={{
          width: maskable ? "14%" : "16%",
          height: maskable ? "14%" : "16%",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #ffffff 0%, #ebe7fb 100%)",
          boxShadow: "0 0 22px rgba(216,207,248,0.85)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "20%",
          width: "3%",
          height: "3%",
          borderRadius: "50%",
          background: "#e8e6e3",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "16%",
          right: "18%",
          width: "2.2%",
          height: "2.2%",
          borderRadius: "50%",
          background: "#e8e6e3",
          opacity: 0.32,
        }}
      />
    </div>
  );
}
