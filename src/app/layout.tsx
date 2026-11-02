import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "BelzGraphics — Design & Branding", template: "%s · BelzGraphics" },
  description:
    "Flyers, logos, brand identities, merch and motion design by Afeez. Pick a design, see samples and order in minutes.",
  openGraph: { siteName: "BelzGraphics", type: "website", images: ["/og.jpg"] },
  appleWebApp: { capable: true, title: "BelzGraphics", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#7c41f1",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
