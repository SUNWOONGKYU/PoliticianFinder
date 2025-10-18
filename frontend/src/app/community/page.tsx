import React from 'react';
import Link from 'next/link';
import PostList from '@/components/community/PostList';
import { PenSquare } from 'lucide-react';
import type { PostsResponse } from '@/types/post';

export const metadata = {
  title: '커뮤니티 | PoliticianFinder',
  description: '정치인과 정치 이슈에 대해 자유롭게 토론하는 공간',
};

// 서버 컴포넌트에서 초기 데이터 로드
async function getInitialPosts(): Promise<PostsResponse | null> {
  try {
    // Vercel 환경에서 절대 URL 구성
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const response = await fetch(
      `${baseUrl}/api/posts?limit=20&sort=latest`,
      {
        cache: 'no-store', // 항상 최신 데이터
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch posts:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Failed to fetch initial posts:', error);
  }
  return null;
}

export default async function CommunityPage() {
  const initialData = await getInitialPosts();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">커뮤니티</h1>
          <p className="text-gray-600 mt-1">정치인과 정치 이슈에 대해 자유롭게 토론하세요</p>
        </div>
        <Link
          href="/write"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PenSquare className="w-4 h-4 mr-2" />
          글쓰기
        </Link>
      </div>

      {/* 공지사항 또는 안내 메시지 (선택사항) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          💡 건전한 토론 문화를 위해 서로를 존중하는 댓글을 작성해주세요.
          욕설, 비방, 허위사실 유포 등은 제재 대상이 될 수 있습니다.
        </p>
      </div>

      {/* 게시글 목록 */}
      <PostList initialData={initialData} />
    </div>
  );
}