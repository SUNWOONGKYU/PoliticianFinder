import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Politician Finder - 훌륭한 정치인을 찾아드립니다',
  description: '정치인 평가 및 커뮤니티 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
