import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2026 지방선거 광역단체장 지도',
  description: '2026 지방선거 광역단체장 후보 현황',
};

export default function ElectionMapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
