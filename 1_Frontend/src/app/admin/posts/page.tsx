'use client';

import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';

interface Post {
  id: number;
  title: string;
  author: string;
  date: string;
}

interface Comment {
  id: number;
  content: string;
  author: string;
  postTitle: string;
  date: string;
}

interface Notice {
  id: number;
  title: string;
  author: string;
  date: string;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: 101,
    title: '우리 지역 정치인 평가 어떤가요?',
    author: '시민123',
    date: '2025-10-26',
  },
  {
    id: 102,
    title: '이번 정책에 대한 의견 나눔',
    author: '정치관심러',
    date: '2025-10-25',
  },
];

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: 201,
    content: '좋은 의견입니다!',
    author: '열정시민',
    postTitle: '우리 지역 정치인 평가 어떤가요?',
    date: '2025-10-26',
  },
];

const SAMPLE_NOTICES: Notice[] = [
  {
    id: 1,
    title: 'PoliticianFinder 정식 오픈!',
    author: '운영자',
    date: '2025-10-28',
  },
  {
    id: 2,
    title: 'AI 평가 시스템 업데이트 안내',
    author: '운영자',
    date: '2025-10-25',
  },
];

type TabType = 'posts' | 'comments' | 'notices';

export default function AdminPostsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [searchText, setSearchText] = useState('');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <AdminSidebar />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">콘텐츠 관리</h1>

          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Tabs */}
            <div className="border-b mb-4">
              <nav className="flex gap-6 -mb-px">
                <button
                  className={`py-3 px-1 border-b-2 ${
                    activeTab === 'posts'
                      ? 'border-blue-500 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-blue-500'
                  }`}
                  onClick={() => setActiveTab('posts')}
                >
                  게시글 관리
                </button>
                <button
                  className={`py-3 px-1 border-b-2 ${
                    activeTab === 'comments'
                      ? 'border-blue-500 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-blue-500'
                  }`}
                  onClick={() => setActiveTab('comments')}
                >
                  댓글 관리
                </button>
                <button
                  className={`py-3 px-1 border-b-2 ${
                    activeTab === 'notices'
                      ? 'border-blue-500 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-blue-500'
                  }`}
                  onClick={() => setActiveTab('notices')}
                >
                  공지사항 관리
                </button>
              </nav>
            </div>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="게시글 검색 (제목, 내용, 작성자)"
                    className="flex-grow p-2 border rounded-lg"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    검색
                  </button>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">제목</th>
                      <th className="p-3">작성자</th>
                      <th className="p-3">작성일</th>
                      <th className="p-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_POSTS.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{post.id}</td>
                        <td className="p-3 font-semibold">{post.title}</td>
                        <td className="p-3">{post.author}</td>
                        <td className="p-3">{post.date}</td>
                        <td className="p-3">
                          <button className="text-red-500 hover:underline">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="댓글 검색 (내용, 작성자)"
                    className="flex-grow p-2 border rounded-lg"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    검색
                  </button>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">내용</th>
                      <th className="p-3">작성자</th>
                      <th className="p-3">게시글</th>
                      <th className="p-3">작성일</th>
                      <th className="p-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_COMMENTS.map((comment) => (
                      <tr key={comment.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{comment.id}</td>
                        <td className="p-3">{comment.content}</td>
                        <td className="p-3">{comment.author}</td>
                        <td className="p-3 text-sm text-gray-600">{comment.postTitle}</td>
                        <td className="p-3">{comment.date}</td>
                        <td className="p-3">
                          <button className="text-red-500 hover:underline">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notices Tab */}
            {activeTab === 'notices' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-4 flex-grow">
                    <input
                      type="text"
                      placeholder="공지사항 검색 (제목, 내용)"
                      className="flex-grow p-2 border rounded-lg"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                      검색
                    </button>
                  </div>
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 ml-4">
                    + 새 공지 작성
                  </button>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">제목</th>
                      <th className="p-3">작성자</th>
                      <th className="p-3">작성일</th>
                      <th className="p-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_NOTICES.map((notice) => (
                      <tr key={notice.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{notice.id}</td>
                        <td className="p-3 font-semibold">{notice.title}</td>
                        <td className="p-3">{notice.author}</td>
                        <td className="p-3">{notice.date}</td>
                        <td className="p-3 space-x-2">
                          <button className="text-blue-500 hover:underline">수정</button>
                          <button className="text-red-500 hover:underline">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
