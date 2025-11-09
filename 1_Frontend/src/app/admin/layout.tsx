/**
 * 관리자 페이지 전용 레이아웃
 * 일반 페이지의 Header/Footer를 제거하고 관리자 전용 UI 사용
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
