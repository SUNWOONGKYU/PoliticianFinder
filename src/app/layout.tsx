import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { WebVitalsReporter } from "./web-vitals";
import "./globals.css";
import "./brand-colors.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://politician-finder.vercel.app'),
  title: {
    default: "정치인 찾기 - PoliticianFinder",
    template: "%s | 정치인 찾기",
  },
  description: "대한민국 정치인 정보 검색 플랫폼. 정치인 이름, 정당, 지역으로 검색하고 의정 활동을 확인하세요.",
  keywords: ["정치인", "국회의원", "정치", "선거", "공약", "정당", "의정활동", "국회"],
  authors: [{ name: "PoliticianFinder Team" }],
  creator: "PoliticianFinder Team",
  publisher: "PoliticianFinder",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "정치인 찾기 - PoliticianFinder",
    description: "대한민국 정치인 정보 검색 플랫폼",
    type: "website",
    locale: "ko_KR",
    siteName: "정치인 찾기",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "정치인 찾기 - PoliticianFinder",
    description: "대한민국 정치인 정보 검색 플랫폼",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
