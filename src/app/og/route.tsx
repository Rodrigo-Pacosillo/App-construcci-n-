import { ImageResponse } from "next/og";

export const runtime = "edge";

type FuenteOg = {
  name: string;
  data: ArrayBuffer;
  style: "normal";
  weight: 400 | 900;
};

// Los .ttf viven en /public/fonts (satori no acepta woff2). Se cachean en memoria
// del isolate para no re-descargarlos en cada render de imagen.
let fuentesCache: FuenteOg[] | null = null;

async function cargarFuentes(req: Request): Promise<FuenteOg[] | undefined> {
  if (fuentesCache) return fuentesCache;

  try {
    const [regular, black] = await Promise.all([
      fetch(new URL("/fonts/archivo-400.ttf", req.url)).then((res) => {
        if (!res.ok) throw new Error(`archivo-400.ttf: ${res.status}`);
        return res.arrayBuffer();
      }),
      fetch(new URL("/fonts/archivo-900.ttf", req.url)).then((res) => {
        if (!res.ok) throw new Error(`archivo-900.ttf: ${res.status}`);
        return res.arrayBuffer();
      }),
    ]);

    fuentesCache = [
      { name: "Archivo", data: regular, style: "normal", weight: 400 },
      { name: "Archivo", data: black, style: "normal", weight: 900 },
    ];
    return fuentesCache;
  } catch (error) {
    // Sin la fuente propia, ImageResponse usa la fuente embebida por defecto.
    // Preferimos una OG con tipografía distinta antes que un 500.
    console.error(
      "[og] no se pudieron cargar las fuentes:",
      error instanceof Error ? error.message : String(error)
    );
    return undefined;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "CONSTR-ART";
  const subtitle = searchParams.get("subtitle") || "Construcción en Seco y Tradicional";
  const type = searchParams.get("type") || "default";

  const isDark = type === "dark";
  const fuentes = await cargarFuentes(req);

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
          fontFamily: "Archivo",
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "90%",
          }}
        >
          <div
            style={{
              fontFamily: "Archivo",
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: isDark ? "#FFB300" : "#FF8F00",
              marginBottom: 24,
            }}
          >
            CONSTR-ART
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Archivo",
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 16,
              textShadow: isDark ? "0 4px 24px rgba(255, 179, 0, 0.15)" : "none",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Archivo",
              fontSize: 28,
              fontWeight: 400,
              color: isDark ? "rgba(242, 241, 236, 0.7)" : "rgba(23, 24, 26, 0.6)",
              maxWidth: 800,
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
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
      fonts: fuentes,
    }
  );
}