'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import type { CreatePostDto, UpdatePostDto, Post } from '@/types/post';

interface PostFormProps {
  post?: Post; // 수정 모드일 때 기존 게시글 데이터
  mode?: 'create' | 'edit';
}

interface Politician {
  id: number;
  name: string;
  party: string;
}

export default function PostForm({ post, mode = 'create' }: PostFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<CreatePostDto>({
    title: post?.title || '',
    content: post?.content || '',
    category: post?.category || 'general',
    politician_id: post?.politician_id || null,
    post_type: post?.post_type || 'review',
    status: post?.status === 'draft' ? 'draft' : 'published',
    excerpt: post?.excerpt || null,
    tags: post?.tags || [],
  });

  const [selectedPolitician, setSelectedPolitician] = useState<Politician | null>(
    post?.politician || null
  );

  // 정치인 검색
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/politicians/search?q=${searchQuery}&limit=10`);
          if (response.ok) {
            const result = await response.json();
            // API 응답 구조에 맞게 처리
            const politiciansData = result.data || result;
            setPoliticians(Array.isArray(politiciansData) ? politiciansData : []);
          }
        } catch (error) {
          console.error('Failed to search politicians:', error);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setPoliticians([]);
    }
  }, [searchQuery]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      tags,
    }));
  };

  const selectPolitician = (politician: Politician) => {
    setSelectedPolitician(politician);
    setFormData((prev) => ({
      ...prev,
      politician_id: politician.id,
    }));
    setSearchQuery('');
    setPoliticians([]);
  };

  const removePolitician = () => {
    setSelectedPolitician(null);
    setFormData((prev) => ({
      ...prev,
      politician_id: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        status: isDraft ? 'draft' : 'published',
        excerpt: formData.content.substring(0, 200).trim() || null,
      };

      const url = mode === 'edit' ? `/api/posts/${post?.id}` : '/api/posts';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(mode === 'edit' ? '게시글이 수정되었습니다.' : '게시글이 작성되었습니다.');
        router.push(`/post/${data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || '작성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to submit post:', error);
      alert('작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={(e) => handleSubmit(e, false)}>
      {/* 카테고리 선택 */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="general">자유</option>
          <option value="politics">정치</option>
          <option value="question">질문</option>
          <option value="review">평가</option>
        </select>
      </div>

      {/* 정치인 선택 (선택사항) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          관련 정치인 (선택사항)
        </label>
        {selectedPolitician ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <span className="text-sm">
              {selectedPolitician.name} ({selectedPolitician.party})
            </span>
            <button
              type="button"
              onClick={removePolitician}
              className="ml-auto text-gray-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="정치인 이름으로 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {politicians.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {politicians.map((politician) => (
                  <button
                    key={politician.id}
                    type="button"
                    onClick={() => selectPolitician(politician)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium">{politician.name}</div>
                    <div className="text-xs text-gray-500">{politician.party}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 제목 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          maxLength={200}
          placeholder="제목을 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-1 text-xs text-gray-500 text-right">
          {formData.title.length}/200
        </div>
      </div>

      {/* 내용 */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          rows={15}
          placeholder="내용을 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* 태그 */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          태그 (선택사항)
        </label>
        <input
          type="text"
          id="tags"
          value={formData.tags?.join(', ') || ''}
          onChange={handleTagsChange}
          placeholder="태그를 쉼표로 구분하여 입력 (예: 정치, 개혁, 토론)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 제출 버튼 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          취소
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, true)}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            임시저장
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? '수정하기' : '발행하기'}
          </button>
        </div>
      </div>
    </form>
  );
}