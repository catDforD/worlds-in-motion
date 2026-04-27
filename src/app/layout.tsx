import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "织世录",
  description: "多智能体叙事沙盘前端工程",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
