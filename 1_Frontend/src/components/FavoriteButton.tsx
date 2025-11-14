// P3BA28: 정치인 관심 등록 버튼 컴포넌트
'use client';

import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
  politicianId: string;
  politicianName: string;
}

export default function FavoriteButton({ politicianId, politicianName }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

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
          alert(`${politicianName} 님을 관심 정치인에서 제거했습니다.`);
        } else {
          const data = await response.json();
          alert(data.error || '관심 취소에 실패했습니다.');
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
          alert(`${politicianName} 님을 관심 정치인으로 등록했습니다.`);
        } else {
          const data = await response.json();
          if (response.status === 401) {
            alert('로그인이 필요합니다.');
            window.location.href = '/auth/login';
          } else {
            alert(data.error || '관심 등록에 실패했습니다.');
          }
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
        isFavorite
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isFavorite ? (
        <>
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>관심 취소</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>관심 등록</span>
        </>
      )}
    </button>
  );
}
