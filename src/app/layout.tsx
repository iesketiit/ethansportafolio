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
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=IBM+Plex+Sans+JP:wght@300;400;500&family=Reenie+Beanie&display=swap"
        />
      </head>
      <body>
        {/* Filtro "goo": une gotas como líquido (títulos que gotean) */}
        <svg className="svg-defs" aria-hidden="true" focusable="false">
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </svg>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
