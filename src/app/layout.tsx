import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import MetaPixel from "@/components/analytics/MetaPixel";
import {
  GOOGLE_SITE_VERIFICATION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const calSans = localFont({
  src: "./fonts/CalSans-Regular.woff2",
  variable: "--font-cal-sans",
  weight: "600",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "시소사인 | 간판 제작 · 사이니지 디자인 · 브랜딩 전문",
    template: "%s | 시소사인",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "간판 제작",
    "사이니지",
    "사이니지 디자인",
    "브랜딩",
    "브랜드 디자인",
    "공간 디자인",
    "상업 공간 사인",
    "LED 간판",
    "채널 사인",
    "시소사인",
    "siso-sign",
  ],
  authors: [{ name: "시소사인" }],
  creator: "시소사인",
  publisher: "시소사인",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.jpg",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "시소사인 | 간판 제작 · 사이니지 디자인 · 브랜딩 전문",
    description:
      "시소사인은 공간의 가치를 높이는 간판 제작, 사이니지 디자인, 브랜딩 전문 에이전시입니다.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "시소사인 - 간판 제작, 사이니지 디자인, 브랜딩",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "시소사인 | 간판 제작 · 사이니지 디자인 · 브랜딩 전문",
    description:
      "시소사인은 공간의 가치를 높이는 간판 제작, 사이니지 디자인, 브랜딩 전문 에이전시입니다.",
    images: ["/opengraph-image"],
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
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    ...(process.env.NAVER_SITE_VERIFICATION
      ? {
          other: {
            "naver-site-verification": process.env.NAVER_SITE_VERIFICATION,
          },
        }
      : {}),
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${calSans.variable} antialiased`}
      >
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
