import { ImageResponse } from "next/og";
import { Archivo } from "next/font/google";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Steel Frame";
  const subtitle = searchParams.get("subtitle") || "Construccion en Seco";
  const type = searchParams.get("type") || "default";

  const isDark = type === "dark";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#0C0D10" : "#FAFAF8",
          fontFamily: archivo.style.fontFamily,
          color: isDark ? "#F2F1EC" : "#17181A",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Pattern background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(255, 179, 0, ${isDark ? "0.08" : "0.04"}) 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, rgba(255, 179, 0, ${isDark ? "0.02" : "0.01"}), rgba(255, 179, 0, ${isDark ? "0.02" : "0.01"}) 1px, transparent 1px, transparent 24px)`,
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #FFB300, #FF8F00)",
          }}
        />

        {/* Content */}
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: "90%" }}>
          <p
            style={{
              fontFamily: archivo.style.fontFamily,
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: isDark ? "#FFB300" : "#FF8F00",
              marginBottom: 24,
            }}
          >
            Steel Frame
          </p>
          <h1
            style={{
              fontFamily: archivo.style.fontFamily,
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 16,
              textShadow: isDark ? "0 4px 24px rgba(255, 179, 0, 0.15)" : "none",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: archivo.style.fontFamily,
              fontSize: 28,
              fontWeight: 400,
              color: isDark ? "rgba(242, 241, 236, 0.7)" : "rgba(23, 24, 26, 0.6)",
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #FFB300, #FF8F00)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Archivo",
          data: await fetch(
            "https://fonts.gstatic.com/s/archivo/v23/k3kUo8kEI-tA1RRcTZGmTlHGCacds86x.woff2"
          ).then((res) => res.arrayBuffer()),
          style: "normal",
          weight: 900,
        },
      ],
    }
  );
}