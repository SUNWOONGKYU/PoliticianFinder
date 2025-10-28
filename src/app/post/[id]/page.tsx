import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Eye, Heart, MessageCircle, Share2, Edit, Trash2, ArrowLeft } from 'lucide-react';
import PostActions from './PostActions';
import type { Post } from '@/types/post';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 서버 컴포넌트에서 게시글 데이터 로드
async function getPost(id: string): Promise<Post | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const response = await fetch(
      `${baseUrl}/api/posts/${id}`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch post:', error);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  return {
    title: `${post.title} | PoliticianFinder`,
    description: post.excerpt || post.content.substring(0, 160),
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 뒤로가기 버튼 */}
      <Link
        href="/community"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        목록으로
      </Link>

      {/* 게시글 본문 */}
      <article className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* 카테고리와 정치인 정보 */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
                categoryColors[post.category]
              }`}
            >
              {categoryLabels[post.category]}
            </span>
            {post.politician && (
              <Link
                href={`/politicians/${post.politician.id}`}
                className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              >
                {post.politician.name} ({post.politician.party})
              </Link>
            )}
            {post.is_hot && (
              <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-800">
                🔥 HOT
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {/* 작성자 정보 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {post.author?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {post.author?.username || '익명'}
                </div>
                <div className="text-sm text-gray-500">{formatDate(post.created_at)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
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

          {/* 본문 내용 */}
          <div className="py-6 prose prose-lg max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* 태그 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 수정 시간 표시 */}
          {post.edited_at && (
            <div className="text-sm text-gray-500 mt-4">
              마지막 수정: {formatDate(post.edited_at)}
            </div>
          )}
        </div>

        {/* 액션 버튼들 (클라이언트 컴포넌트) */}
        <PostActions post={post} />
      </article>

      {/* 댓글 섹션 (추후 구현) */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          댓글 <span className="text-blue-600">{post.comment_count}</span>
        </h2>
        <div className="text-center py-8 text-gray-500">
          댓글 기능은 준비 중입니다.
        </div>
      </div>
    </div>
  );
}