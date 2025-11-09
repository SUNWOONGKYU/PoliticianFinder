'use client';

// Task ID: P1F10
// 유저 프로필 페이지

import { useParams } from 'next/navigation';
import { useState } from 'react';

type TabType = 'posts' | 'comments' | 'stats';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  categoryColor: string;
  date: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
}

interface Comment {
  id: number;
  postTitle: string;
  content: string;
  date: string;
  likes: number;
  dislikes: number;
}

interface UserProfile {
  id: string;
  name: string;
  level: string;
  bio: string;
  postsCount: number;
  commentsCount: number;
  points: number;
  isPrivate: boolean;
}

// Sample data
const sampleProfile: UserProfile = {
  id: '1',
  name: '민주시민',
  level: 'ML5',
  bio: '정치에 관심이 많은 평범한 시민입니다. 더 나은 사회를 만들기 위해 함께 고민하고 토론하는 것을 좋아합니다.',
  postsCount: 24,
  commentsCount: 156,
  points: 1248,
  isPrivate: false,
};

const samplePosts: Post[] = [
  {
    id: 1,
    title: 'AI 평가 시스템의 신뢰성에 대한 토론',
    content: 'Claude AI의 정치인 평가가 얼마나 객관적일 수 있을까요? 여러분의 의견을 들어보고 싶습니다...',
    category: '자유게시판',
    categoryColor: 'bg-blue-100 text-blue-700',
    date: '2025-01-24 10:23',
    views: 234,
    likes: 12,
    dislikes: 3,
    comments: 8,
    shares: 5,
  },
  {
    id: 2,
    title: '우리 동네 국회의원 찾기 기능 건의',
    content: '주소 입력하면 해당 지역구 국회의원을 바로 볼 수 있으면 좋겠어요...',
    category: '기능건의',
    categoryColor: 'bg-purple-100 text-purple-700',
    date: '2025-01-22 16:45',
    views: 156,
    likes: 28,
    dislikes: 5,
    comments: 15,
    shares: 3,
  },
  {
    id: 3,
    title: '정치인 평가 기준이 궁금합니다',
    content: 'AI가 어떤 데이터를 기반으로 평가하는지 자세한 설명이 있으면 좋겠습니다...',
    category: '자유게시판',
    categoryColor: 'bg-blue-100 text-blue-700',
    date: '2025-01-20 09:12',
    views: 189,
    likes: 7,
    dislikes: 2,
    comments: 12,
    shares: 4,
  },
];

const sampleComments: Comment[] = [
  {
    id: 1,
    postTitle: '2025년 정치 개혁 방향',
    content: '정말 공감합니다. 특히 투명성 강화 부분이 중요하다고 생각해요. 국민들이 정치인의 활동을 실시간으로 볼 수 있어야 합니다.',
    date: '2025-01-24 14:32',
    likes: 5,
    dislikes: 1,
  },
  {
    id: 2,
    postTitle: 'AI 평가의 한계점',
    content: 'AI도 결국 데이터를 기반으로 하기 때문에 편향이 있을 수 있다는 점을 인지해야 합니다. 하지만 그럼에도 기존 방식보다는 객관적이라고 봅니다.',
    date: '2025-01-23 09:15',
    likes: 12,
    dislikes: 0,
  },
  {
    id: 3,
    postTitle: '지역구 의원 활동 비교',
    content: '우리 지역구 의원은 AI 평가에서 높은 점수를 받았는데 실제로도 활동을 열심히 하시더라고요. 믿을만한 것 같습니다.',
    date: '2025-01-21 18:42',
    likes: 8,
    dislikes: 2,
  },
];

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // In real implementation, fetch user data based on userId
  // For now, using sample data
  const profile = sampleProfile;

  if (profile.isPrivate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Name & Level */}
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-secondary-600 font-medium mt-1">{profile.level}</p>
                </div>

                {/* Bio - Private */}
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">자기소개</h3>
                  <div className="text-sm text-gray-500 text-center py-4">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    비공개 계정입니다
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content: Private Message */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">비공개 계정입니다</h3>
                <p className="text-gray-600">이 사용자의 게시글과 활동 내역은 공개되지 않습니다.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Name & Level */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-secondary-600 font-medium mt-1">{profile.level}</p>
              </div>

              {/* Bio */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-sm font-bold text-gray-700 mb-2">자기소개</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {profile.bio}
                </p>
              </div>

              {/* Stats Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">게시글</span>
                  <span className="text-lg font-bold text-gray-900">{profile.postsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">댓글</span>
                  <span className="text-lg font-bold text-gray-900">{profile.commentsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">포인트</span>
                  <span className="text-lg font-bold text-gray-900">{profile.points.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content: Tabs */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 px-6 py-4 text-center font-medium border-b-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'border-secondary-500 text-secondary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  내 게시글
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 px-6 py-4 text-center font-medium border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-secondary-500 text-secondary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  내 댓글
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 px-6 py-4 text-center font-medium border-b-2 transition-colors ${
                    activeTab === 'stats'
                      ? 'border-secondary-500 text-secondary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  활동 내역
                </button>
              </div>
            </div>

            {/* Tab Content: Posts */}
            {activeTab === 'posts' && (
              <div>
                <div className="bg-white rounded-lg shadow-md divide-y">
                  {samplePosts.map((post) => (
                    <div key={post.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 hover:text-secondary-600">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{post.date}</span>
                            <span>조회수 {post.views}</span>
                            <span className="text-red-600">👍 {post.likes}</span>
                            <span className="text-gray-400">👎 {post.dislikes}</span>
                            <span>댓글 {post.comments}</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                              <span>공유 {post.shares}</span>
                            </span>
                          </div>
                        </div>
                        <span className={`ml-4 px-2 py-1 text-xs font-medium rounded ${post.categoryColor}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-6 flex justify-center">
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      이전
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-secondary-500 text-sm font-medium text-white">
                      1
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      2
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      3
                    </button>
                    <button className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* Tab Content: Comments */}
            {activeTab === 'comments' && (
              <div>
                <div className="bg-white rounded-lg shadow-md divide-y">
                  {sampleComments.map((comment) => (
                    <div key={comment.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="text-sm text-gray-500 mb-2">
                        <a href="#" className="font-medium text-secondary-600 hover:underline">
                          {comment.postTitle}
                        </a>
                        에 댓글을 남겼습니다
                      </div>
                      <p className="text-sm text-gray-900">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{comment.date}</span>
                        <span className="text-red-600">👍 {comment.likes}</span>
                        <span className="text-gray-400">👎 {comment.dislikes}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-6 flex justify-center">
                  <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      이전
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-secondary-500 text-sm font-medium text-white">
                      1
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      2
                    </button>
                    <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      3
                    </button>
                    <button className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* Tab Content: Stats */}
            {activeTab === 'stats' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">활동 통계</h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">총 게시글</div>
                    <div className="text-2xl font-bold text-blue-600">24</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">총 댓글</div>
                    <div className="text-2xl font-bold text-purple-600">156</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">받은 공감</div>
                    <div className="text-2xl font-bold text-green-600">342</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Best 글</div>
                    <div className="text-2xl font-bold text-pink-600">3</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Hot 글</div>
                    <div className="text-2xl font-bold text-red-600">5</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">활동 일수</div>
                    <div className="text-2xl font-bold text-indigo-600">127</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border-t pt-6 mt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">최근 활동</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">게시글 작성</p>
                        <p className="text-xs text-gray-500">AI 평가 시스템의 신뢰성에 대한 토론 • 2025-01-24</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">댓글 작성</p>
                        <p className="text-xs text-gray-500">2025년 정치 개혁 방향 • 2025-01-24</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">공감 받음</p>
                        <p className="text-xs text-gray-500">우리 동네 국회의원 찾기 기능 건의 • 2025-01-23</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
