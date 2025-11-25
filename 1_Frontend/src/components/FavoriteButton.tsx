// P3BA28: 정치인 관심 등록 버튼 컴포넌트
'use client';

import { useState, useEffect } from 'react';
import Toast from './Toast';

interface FavoriteButtonProps {
  politicianId: string;
  politicianName: string;
  compact?: boolean; // 아이콘만 표시
}

export default function FavoriteButton({ politicianId, politicianName, compact = false }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 관심 등록 여부 확인
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const isFav = data.data.some((fav: any) => fav.politician_id === politicianId);
            setIsFavorite(isFav);
          }
        }
      } catch (err) {
        console.error('Error checking favorite:', err);
      }
    };

    checkFavorite();
  }, [politicianId]);

  const handleToggleFavorite = async () => {
    setLoading(true);

    try {
      if (isFavorite) {
        // 관심 취소
        const response = await fetch(`/api/favorites?politician_id=${politicianId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavorite(false);
          setToast({ message: `${politicianName} 님을 관심 정치인에서 제거했습니다.`, type: 'success' });
        } else {
          const data = await response.json();
          setToast({ message: data.error || '관심 취소에 실패했습니다.', type: 'error' });
        }
      } else {
        // 관심 등록
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            politician_id: politicianId,
            notification_enabled: true, // 기본으로 알림 받기 설정
          }),
        });

        if (response.ok) {
          setIsFavorite(true);
          setToast({ message: `${politicianName} 님을 관심 정치인으로 등록했습니다.`, type: 'success' });
        } else {
          const data = await response.json();
          if (response.status === 401) {
            setToast({ message: '로그인이 필요합니다.', type: 'error' });
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 2000);
          } else {
            setToast({ message: data.error || '관심 등록에 실패했습니다.', type: 'error' });
          }
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setToast({ message: '오류가 발생했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <button
        onClick={handleToggleFavorite}
        disabled={loading}
        className={`flex items-center justify-center gap-2 font-medium transition min-h-[44px] ${
          compact
            ? `w-11 h-11 rounded-full shadow-lg ${isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-primary-600 hover:bg-gray-100'}`
            : `px-4 py-2 rounded-lg ${isFavorite ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isFavorite ? '관심 정치인 취소' : '관심 정치인 등록'}
      >
        {isFavorite ? (
          <>
            <svg className={`${compact ? 'w-5 h-5' : 'w-5 h-5'} fill-current`} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {!compact && <span>관심 취소</span>}
          </>
        ) : (
          <>
            <svg className={`${compact ? 'w-5 h-5' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {!compact && <span>관심 정치인 등록</span>}
          </>
        )}
      </button>
    </>
  );
}
