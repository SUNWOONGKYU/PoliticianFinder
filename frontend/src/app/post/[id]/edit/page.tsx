import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import PostForm from '@/components/community/PostForm';
import type { Post } from '@/types/post';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPost(id: string, userId: string): Promise<Post | null> {
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

    if (response.ok) {
      const post = await response.json();
      // 작성자만 수정 가능
      if (post.user_id === userId) {
        return post;
      }
    }
  } catch (error) {
    console.error('Failed to fetch post for edit:', error);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `게시글 수정 | PoliticianFinder`,
  };
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;

  // 서버 컴포넌트에서 인증 확인
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/post/${id}/edit`);
  }

  const post = await getPost(id, user.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">게시글 수정</h1>
        </div>
        <div className="p-6">
          <PostForm post={post} mode="edit" />
        </div>
      </div>
    </div>
  );
}