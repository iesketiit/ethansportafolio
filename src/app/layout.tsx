import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import { site } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${site.name}, desarrollo web`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { title: `${site.name}, desarrollo web`, description: site.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- en App Router el layout raíz aplica a todas las páginas */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=IBM+Plex+Sans+JP:wght@300;400;500&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
