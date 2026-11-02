import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BelzGraphics — Design & Branding",
    short_name: "BelzGraphics",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6fb",
    theme_color: "#7c41f1",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
