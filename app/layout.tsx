import type { Metadata } from "next";
import "./globals.css";
import "./helios.css";

export const metadata: Metadata = {
  title: "HELIOS — Space Weather Lab",
  description: "太陽から地球まで。公開観測・CME伝播モデル・イベント再生・論文の予測根拠をつなぐ宇宙天気研究プラットフォーム。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
