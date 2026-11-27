import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_CHAT_URL, SITE_DISCORD_URL, SITE_GITHUB_URL } from "@/lib/site";
import "./globals.css";

const archivo = localFont({
  src: "../fonts/archivo-var.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
});

const instrumentSerif = localFont({
  src: [
    { path: "../fonts/instrument-serif.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

const jetbrainsMono = localFont({
  src: "../fonts/jetbrains-mono-var.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
});

const siteUrl = "https://koma-studio.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KOMA Studio - Open-Source Scanlation Software for Manga Translation",
    template: "%s | KOMA Studio",
  },
  description:
    "Free and open-source (MIT) scanlation studio for manga, manhwa & comics. Translate, clean, typeset, and redraw with one AI pipeline — self-hosted, no credits, no lock-in.",
  keywords: [
    "open source manga translation software",
    "open source scanlation tool",
    "self-hosted AI manga translator",
    "MIT licensed scanlation software",
    "free manga translation software",
    "manhwa translation",
    "comic typesetting",
    "manga cleaning tool",
    "redraw AI",
    "scanlation desktop app",
    "KOMA Studio",
  ],
  authors: [{ name: "KOMA Studio" }],
  creator: "KOMA Studio",
  publisher: "KOMA Studio",
  applicationName: "KOMA Studio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "KOMA Studio",
    title: "KOMA Studio - Open-Source Scanlation Software for Manga Translation",
    description:
      "Free and open-source (MIT) scanlation studio for manga, manhwa & comics. Translate, clean, typeset, and redraw with one AI pipeline — self-hosted, no credits, no lock-in.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "KOMA Studio - Open-Source Scanlation Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KOMA Studio - Open-Source Scanlation Software",
    description:
      "Open-source (MIT) scanlation studio for manga, manhwa & comics. Self-hosted, free forever.",
    images: ["/opengraph-image"],
    creator: "@KomaStudio",
  },
  category: "technology",
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/manifest.webmanifest",
  other: {
    "ai:site": siteUrl,
    "ai:chat": SITE_CHAT_URL,
    "ai:community": SITE_DISCORD_URL,
    "ai:repository": SITE_GITHUB_URL,
    "ai:license": "MIT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="bg-ink text-paper antialiased">{children}</body>
    </html>
  );
}
