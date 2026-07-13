import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "致每一位默默守护的家人｜前进民爆安全家书",
  description:
    "安全生产月，前进民爆致员工与家属的一封家书：高高兴兴上班，平平安安回家。",
  icons: {
    icon: `${basePath}/qianxiaojin-wave.png`,
    apple: `${basePath}/qianxiaojin-wave.png`,
  },
  openGraph: {
    title: "平平安安回家｜前进民爆安全家书",
    description: "致每一位默默守护的家人。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
