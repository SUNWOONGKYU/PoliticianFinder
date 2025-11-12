'use client';

import { useState, useEffect } from 'react';
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

type TabType = 'posts' | 'comments' | 'notices';

export default function AdminPostsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [searchText, setSearchText] = useState('');

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Notices state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticesError, setNoticesError] = useState<string | null>(null);

  // Fetch posts from API
  const fetchPosts = async (search?: string) => {
    setPostsLoading(true);
    setPostsError(null);

    try {
      const url = search
        ? `/api/posts?search=${encodeURIComponent(search)}`
        : '/api/posts';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPostsError(error instanceof Error ? error.message : 'Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch comments from API
  const fetchComments = async (search?: string) => {
    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const url = search
        ? `/api/comments?search=${encodeURIComponent(search)}`
        : '/api/comments';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setCommentsError(error instanceof Error ? error.message : 'Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  // Fetch notices from API
  const fetchNotices = async (search?: string) => {
    setNoticesLoading(true);
    setNoticesError(null);

    try {
      const url = search
        ? `/api/notices?search=${encodeURIComponent(search)}`
        : '/api/notices';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch notices: ${response.status}`);
      }

      const data = await response.json();
      setNotices(data);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setNoticesError(error instanceof Error ? error.message : 'Failed to load notices');
    } finally {
      setNoticesLoading(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: number) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Refresh posts list
      await fetchPosts(searchText);
      alert('게시글이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // Refresh comments list
      await fetchComments(searchText);
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // Delete notice
  const handleDeleteNotice = async (noticeId: number) => {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notice');
      }

      // Refresh notices list
      await fetchNotices(searchText);
      alert('공지사항이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  // Handle search
  const handleSearch = () => {
    if (activeTab === 'posts') {
      fetchPosts(searchText);
    } else if (activeTab === 'comments') {
      fetchComments(searchText);
    } else if (activeTab === 'notices') {
      fetchNotices(searchText);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    setSearchText(''); // Clear search when switching tabs

    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'comments') {
      fetchComments();
    } else if (activeTab === 'notices') {
      fetchNotices();
    }
  }, [activeTab]);

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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    onClick={handleSearch}
                  >
                    검색
                  </button>
                </div>

                {postsLoading && (
                  <div className="text-center py-8 text-gray-500">
                    로딩 중...
                  </div>
                )}

                {postsError && (
                  <div className="text-center py-8 text-red-500">
                    오류: {postsError}
                  </div>
                )}

                {!postsLoading && !postsError && (
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
                      {posts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-gray-500">
                            게시글이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        posts.map((post) => (
                          <tr key={post.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{post.id}</td>
                            <td className="p-3 font-semibold">{post.title}</td>
                            <td className="p-3">{post.author}</td>
                            <td className="p-3">{post.date}</td>
                            <td className="p-3">
                              <button
                                className="text-red-500 hover:underline"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    onClick={handleSearch}
                  >
                    검색
                  </button>
                </div>

                {commentsLoading && (
                  <div className="text-center py-8 text-gray-500">
                    로딩 중...
                  </div>
                )}

                {commentsError && (
                  <div className="text-center py-8 text-red-500">
                    오류: {commentsError}
                  </div>
                )}

                {!commentsLoading && !commentsError && (
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
                      {comments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-gray-500">
                            댓글이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        comments.map((comment) => (
                          <tr key={comment.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{comment.id}</td>
                            <td className="p-3">{comment.content}</td>
                            <td className="p-3">{comment.author}</td>
                            <td className="p-3 text-sm text-gray-600">{comment.postTitle}</td>
                            <td className="p-3">{comment.date}</td>
                            <td className="p-3">
                              <button
                                className="text-red-500 hover:underline"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      onClick={handleSearch}
                    >
                      검색
                    </button>
                  </div>
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 ml-4">
                    + 새 공지 작성
                  </button>
                </div>

                {noticesLoading && (
                  <div className="text-center py-8 text-gray-500">
                    로딩 중...
                  </div>
                )}

                {noticesError && (
                  <div className="text-center py-8 text-red-500">
                    오류: {noticesError}
                  </div>
                )}

                {!noticesLoading && !noticesError && (
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
                      {notices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-gray-500">
                            공지사항이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        notices.map((notice) => (
                          <tr key={notice.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{notice.id}</td>
                            <td className="p-3 font-semibold">{notice.title}</td>
                            <td className="p-3">{notice.author}</td>
                            <td className="p-3">{notice.date}</td>
                            <td className="p-3 space-x-2">
                              <button className="text-blue-500 hover:underline">수정</button>
                              <button
                                className="text-red-500 hover:underline"
                                onClick={() => handleDeleteNotice(notice.id)}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
