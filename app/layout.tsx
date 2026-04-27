import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "Your Recipe — 料理動画まとめ",
  description: "人気料理インフルエンサーの動画をジャンル・食材別にまとめたポータルサイト",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
      <GoogleAnalytics gaId="G-0QD9X3VNX4" />
    </html>
  );
}
