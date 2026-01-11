import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
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
  metadataBase: new URL("https://siso-sign.com"),
  title: {
    default: "시소사인 | 간판 제작 · 사이니지 디자인 · 브랜딩 전문",
    template: "%s | 시소사인",
  },
  description:
    "시소사인은 공간의 가치를 높이는 간판 제작, 사이니지 디자인, 브랜딩 전문 에이전시입니다. 전략, 디자인, 기술의 조화로 브랜드의 비주얼 아이덴티티를 완성합니다.",
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
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://siso-sign.com",
    siteName: "시소사인",
    title: "시소사인 | 간판 제작 · 사이니지 디자인 · 브랜딩 전문",
    description:
      "시소사인은 공간의 가치를 높이는 간판 제작, 사이니지 디자인, 브랜딩 전문 에이전시입니다.",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "시소사인 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "시소사인 | 간판 제작 · 사이니지 디자인 · 브랜딩 전문",
    description:
      "시소사인은 공간의 가치를 높이는 간판 제작, 사이니지 디자인, 브랜딩 전문 에이전시입니다.",
    images: ["/logo.jpg"],
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
    // 구글 서치콘솔 인증 후 아래 주석 해제하고 값 입력
    // google: "구글_인증_코드",
    // 네이버 웹마스터 인증 후 아래 주석 해제하고 값 입력
    // other: { "naver-site-verification": "네이버_인증_코드" },
  },
  alternates: {
    canonical: "https://siso-sign.com",
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
      </body>
    </html>
  );
}
