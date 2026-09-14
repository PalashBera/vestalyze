import { ImageResponse } from "next/og";

/** Shared “V” mark used by apple-touch and installable PWA icons. */
export function vestalyzePwaIcon(size: number, maskable = false) {
  const fontSize = Math.round(size * (maskable ? 0.4 : 0.5));
  const radius = maskable ? 0 : Math.round(size * 0.22);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          borderRadius: radius,
          color: "#F5F5F5",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        V
      </div>
    ),
    { width: size, height: size },
  );
}
