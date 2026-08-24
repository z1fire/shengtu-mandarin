import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Shēngtú — HSK 1 Mandarin Sprint";
  const description = "A guided, speaking-first HSK 3.0 Level 1 course with spaced repetition, pronunciation training, and a full mock exam.";

  return {
    title,
    description,
    metadataBase: new URL(origin),
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.svg",
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: { title, description, type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1732, height: 904, alt: "Shēngtú — Stop studying Mandarin. Start using it." }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
    appleWebApp: { capable: true, title: "Shēngtú", statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = {
  themeColor: "#18201d",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body>{children}</body>
    </html>
  );
}
