'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Eye, Heart, MessageCircle, Flame, Pin, User } from 'lucide-react';
import type { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  showPolitician?: boolean;
}

export default function PostCard({ post, showPolitician = true }: PostCardProps) {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  const categoryColors = {
    general: 'bg-gray-100 text-gray-800',
    politics: 'bg-blue-100 text-blue-800',
    question: 'bg-purple-100 text-purple-800',
    review: 'bg-green-100 text-green-800',
  };

  const categoryLabels = {
    general: '자유',
    politics: '정치',
    question: '질문',
    review: '평가',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <Link href={`/post/${post.id}`}>
        <div className="p-4">
          {/* 상단 배지들 */}
          <div className="flex items-center gap-2 mb-2">
            {post.is_pinned && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                <Pin className="w-3 h-3 mr-1" />
                고정
              </span>
            )}
            {post.is_hot && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                <Flame className="w-3 h-3 mr-1" />
                HOT
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${categoryColors[post.category]}`}>
              {categoryLabels[post.category]}
            </span>
            {showPolitician && post.politician && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                {post.politician.name} ({post.politician.party})
              </span>
            )}
          </div>

          {/* 제목 */}
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-1">
            {post.title}
          </h3>

          {/* 내용 미리보기 */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {post.excerpt || post.content}
          </p>

          {/* 하단 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author?.username || '익명'}
              </span>
              <span>{formatDate(post.created_at)}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {post.like_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.comment_count}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}