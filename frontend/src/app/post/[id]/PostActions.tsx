'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Share2, Edit, Trash2, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import type { Post } from '@/types/post';

interface PostActionsProps {
  post: Post;
}

export default function PostActions({ post }: PostActionsProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user?.id === post.user_id;

  // 좋아요 상태 확인
  useEffect(() => {
    if (user) {
      fetch(`/api/posts/${post.id}/like`)
        .then((res) => res.json())
        .then((data) => setLiked(data.liked))
        .catch(console.error);
    }
  }, [post.id, user]);

  // 좋아요 토글
  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    setLiking(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.like_count || likeCount + (data.liked ? 1 : -1));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLiking(false);
    }
  };

  // 공유하기
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || post.content.substring(0, 100),
        url: window.location.href,
      }).catch(console.error);
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('링크가 복사되었습니다.');
      });
    }
  };

  // 게시글 삭제
  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('게시글이 삭제되었습니다.');
        router.push('/community');
      } else {
        const error = await response.json();
        alert(error.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center justify-between">
        {/* 좌측 액션 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            disabled={liking || userLoading}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              liked
                ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {liking ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
            )}
            추천 {likeCount > 0 && `(${likeCount})`}
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유
          </button>
        </div>

        {/* 우측 관리 버튼 (작성자만) */}
        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link
              href={`/post/${post.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}