import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

const SITE_URL = "https://your-recipe-jp.vercel.app";
const SITE_NAME = "ユアレシピ | Your Recipe";
const SITE_DESCRIPTION = "人気料理YouTuberの動画を和食・イタリアン・時短など、ジャンル・食材・料理名で探せる動画まとめサイト。唐揚げ・ハンバーグ・カレーなど人気レシピを一気に発見。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 料理YouTuberの動画まとめ`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "料理動画", "レシピ動画", "YouTuber", "料理YouTuber",
    "和食レシピ", "時短レシピ", "簡単レシピ", "唐揚げレシピ",
    "ハンバーグレシピ", "カレーレシピ", "料理まとめ", "料理インフルエンサー",
  ],
  authors: [{ name: "Your Recipe" }],
  creator: "Your Recipe",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 料理YouTuberの動画まとめ`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ユアレシピ — 料理YouTuberの動画まとめ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 料理YouTuberの動画まとめ`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
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
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-0QD9X3VNX4" />
    </html>
  );
}
