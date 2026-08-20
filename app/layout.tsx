import type { Metadata } from "next";
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
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1732, height: 904, alt: "Shēngtú — Stop studying Mandarin. Start using it." }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
    appleWebApp: { capable: true, title: "Shēngtú", statusBarStyle: "black-translucent" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
