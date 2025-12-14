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
  const [postsPage, setPostsPage] = useState(1);
  const postsPerPage = 20; // 게시글: 20개씩

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsPage, setCommentsPage] = useState(1);
  const commentsPerPage = 20; // 댓글: 20개씩

  // Notices state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticesError, setNoticesError] = useState<string | null>(null);
  const [noticesPage, setNoticesPage] = useState(1);
  const noticesPerPage = 20; // 공지사항: 20개씩

  // Fetch posts from API
  const fetchPosts = async (search?: string) => {
    setPostsLoading(true);
    setPostsError(null);

    try {
      // Fetch all posts for client-side pagination
      const url = search
        ? `/api/admin/content?search=${encodeURIComponent(search)}&limit=1000`
        : '/api/admin/content?limit=1000';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const result = await response.json();
      const rawData = (result.success && Array.isArray(result.data)) ? result.data : (Array.isArray(result) ? result : []);

      // Map the data to match Post interface
      const mappedPosts = rawData.map((post: any) => {
        // author_type에 따라 작성자 결정
        let author = 'Unknown';
        if (post.author_type === 'politician' && post.politicians?.name) {
          // 정치인 게시글: politicians 테이블에서 이름
          author = `${post.politicians.name} (정치인)`;
        } else if (post.users) {
          // 일반 회원 게시글: users 테이블에서 이름
          author = post.users.nickname || post.users.name || post.users.email?.split('@')[0] || 'Unknown';
        }

        return {
          id: post.id,
          title: post.title || 'Untitled',
          author,
          date: new Date(post.created_at).toLocaleDateString('ko-KR'),
        };
      });

      setPosts(mappedPosts);
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
      // Fetch all comments for client-side pagination
      const url = search
        ? `/api/comments?search=${encodeURIComponent(search)}&limit=1000`
        : '/api/comments?limit=1000';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const result = await response.json();
      const rawData = (result.success && Array.isArray(result.data)) ? result.data : (Array.isArray(result) ? result : []);

      // Map the data to match Comment interface
      const mappedComments = rawData.map((comment: any) => {
        // author_type에 따라 작성자 결정
        let author = 'Unknown';
        if (comment.author_type === 'politician' && comment.politicians?.name) {
          // 정치인 댓글: politicians 테이블에서 이름
          author = `${comment.politicians.name} (정치인)`;
        } else if (comment.users) {
          // 일반 회원 댓글: users 테이블에서 이름
          author = comment.users.nickname || comment.users.name || comment.users.email?.split('@')[0] || 'Unknown';
        }

        return {
          id: comment.id,
          content: comment.content || '',
          author,
          postTitle: comment.posts?.title || 'Unknown Post',
          date: new Date(comment.created_at).toLocaleDateString('ko-KR'),
        };
      });

      setComments(mappedComments);
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
      // Fetch all notices for client-side pagination
      const url = search
        ? `/api/notices?search=${encodeURIComponent(search)}&limit=1000`
        : '/api/notices?limit=1000';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch notices: ${response.status}`);
      }

      const result = await response.json();
      const rawData = (result.success && Array.isArray(result.data)) ? result.data : (Array.isArray(result) ? result : []);

      // Map the data to match Notice interface
      const mappedNotices = rawData.map((notice: any) => ({
        id: notice.id,
        title: notice.title || 'Untitled',
        author: 'Admin', // Notices are created by admin
        date: new Date(notice.created_at).toLocaleDateString('ko-KR'),
      }));

      setNotices(mappedNotices);
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
      const response = await fetch(`/api/notices?id=${noticeId}`, {
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

  // Pagination calculations
  const postsTotalPages = Math.ceil(posts.length / postsPerPage);
  const currentPosts = posts.slice((postsPage - 1) * postsPerPage, postsPage * postsPerPage);

  const commentsTotalPages = Math.ceil(comments.length / commentsPerPage);
  const currentComments = comments.slice((commentsPage - 1) * commentsPerPage, commentsPage * commentsPerPage);

  const noticesTotalPages = Math.ceil(notices.length / noticesPerPage);
  const currentNotices = notices.slice((noticesPage - 1) * noticesPerPage, noticesPage * noticesPerPage);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-4 flex justify-center items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          처음
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          이전
        </button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 border rounded text-sm ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          다음
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          마지막
        </button>
      </div>
    );
  };

  // Load data when tab changes
  useEffect(() => {
    setSearchText(''); // Clear search when switching tabs

    if (activeTab === 'posts') {
      fetchPosts();
      setPostsPage(1);
    } else if (activeTab === 'comments') {
      fetchComments();
      setCommentsPage(1);
    } else if (activeTab === 'notices') {
      fetchNotices();
      setNoticesPage(1);
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
                  <>
                    <div className="mb-2 flex justify-between items-center text-sm text-gray-600">
                      <span>총 {posts.length}개 (페이지당 {postsPerPage}개)</span>
                      {postsTotalPages > 1 && <span>페이지: {postsPage} / {postsTotalPages}</span>}
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
                        {currentPosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-gray-500">
                              게시글이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          currentPosts.map((post) => (
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
                  <Pagination currentPage={postsPage} totalPages={postsTotalPages} onPageChange={setPostsPage} />
                  </>
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
                  <>
                    <div className="mb-2 flex justify-between items-center text-sm text-gray-600">
                      <span>총 {comments.length}개 (페이지당 {commentsPerPage}개)</span>
                      {commentsTotalPages > 1 && <span>페이지: {commentsPage} / {commentsTotalPages}</span>}
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
                        {currentComments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-3 text-center text-gray-500">
                              댓글이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          currentComments.map((comment) => (
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
                    <Pagination currentPage={commentsPage} totalPages={commentsTotalPages} onPageChange={setCommentsPage} />
                  </>
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
                  <>
                    <div className="mb-2 flex justify-between items-center text-sm text-gray-600">
                      <span>총 {notices.length}개 (페이지당 {noticesPerPage}개)</span>
                      {noticesTotalPages > 1 && <span>페이지: {noticesPage} / {noticesTotalPages}</span>}
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
                        {currentNotices.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-gray-500">
                              공지사항이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          currentNotices.map((notice) => (
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
                    <Pagination currentPage={noticesPage} totalPages={noticesTotalPages} onPageChange={setNoticesPage} />
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
