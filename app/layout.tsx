import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "소방훈련 일정",
  description: "대상물에 맞는 소방훈련 날짜와 시간을 신청하세요.",
  robots: { index: false, follow: false },
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
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
