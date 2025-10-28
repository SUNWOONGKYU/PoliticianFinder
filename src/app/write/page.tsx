import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PostForm from '@/components/community/PostForm';

export const metadata = {
  title: '새 글 작성 | PoliticianFinder',
  description: '커뮤니티에 새로운 글을 작성하세요',
};

export default async function WritePage() {
  // 서버 컴포넌트에서 인증 확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/write');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">새 글 작성</h1>
        </div>
        <div className="p-6">
          <PostForm mode="create" />
        </div>
      </div>
    </div>
  );
}