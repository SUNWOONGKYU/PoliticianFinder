/**
 * Google 로그인 성공 핸들러 - 클라이언트 컴포넌트
 * URL 파라미터 확인 후 리다이렉트 처리
 */
'use client';

import { useEffect } from 'react';

export default function GoogleLoginHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_login') === 'success') {
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/');
      // 헤더가 세션을 다시 확인하도록 새로고침
      window.location.reload();
    }
  }, []);

  return null;
}
