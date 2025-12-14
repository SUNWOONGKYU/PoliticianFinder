'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FixedCommentInput from '@/components/ui/FixedCommentInput';
import FollowButton from '@/components/FollowButton';
import { formatInfluenceGrade } from '@/utils/memberLevel';

interface Comment {
  id: number;
  author: string;
  userId: string;
  authorType: 'politician' | 'member';
  politicianStatus?: string;
  politicianPosition?: string;
  memberLevel?: string;
  influenceLevel?: string;
  timestamp: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isFollowing: boolean;
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');  // 회원 댓글용
  const [politicianCommentText, setPoliticianCommentText] = useState('');  // 정치인 댓글용
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [displayedComments, setDisplayedComments] = useState(5); // 처음에 5개만 표시
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name?: string } | null>(null);

  // 게시글 수정/삭제 관련 state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 정치인 인증 관련 state
  const [politicianAuthModalOpen, setPoliticianAuthModalOpen] = useState(false);
  const [politicianAuthName, setPoliticianAuthName] = useState('');
  const [politicianAuthParty, setPoliticianAuthParty] = useState('');
  const [politicianAuthPosition, setPoliticianAuthPosition] = useState('');
  const [politicianAuthLoading, setPoliticianAuthLoading] = useState(false);
  const [authenticatedPolitician, setAuthenticatedPolitician] = useState<{ id: string; name: string } | null>(null);

  // 소속 정당 목록 (12개)
  const PARTIES = [
    '더불어민주당', '국민의힘', '조국혁신당', '개혁신당', '진보당',
    '기본소득당', '사회민주당', '녹색정의당', '새로운미래', '자유통일당',
    '무소속', '기타'
  ];

  // 출마직종 목록 (7개)
  const POSITIONS = [
    '국회의원', '광역단체장', '광역의원', '기초단체장', '기초의원', '교육감', '현직'
  ];

  // Sample user nicknames
  const sampleNicknames = [
    '정치는우리의것', '투명한정치', '민주시민', '시민참여자', '투표하는시민',
    '민생이우선', '변화를원해', '미래세대', '깨어있는시민', '정책분석가'
  ];

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.user) {
            setCurrentUser({
              id: result.user.id,
              email: result.user.email,
              name: result.profile?.name || result.profile?.nickname || result.user.email
            });
          }
        }
      } catch (error) {
        console.error('[게시글 상세] 인증 확인 오류:', error);
      }
    };

    checkAuth();
  }, []);

  // Fetch post data from API
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${params.id}`);

        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }

        const result = await response.json();

        if (result.success && result.data) {
          const postData = result.data;

          // Generate consistent nickname based on user_id
          const userIdHash = postData.user_id ? postData.user_id.split('-')[0].charCodeAt(0) : 0;
          const nicknameIndex = userIdHash % 10;

          // Generate consistent member level (ML1-ML5) based on user_id
          const mlLevel = postData.politician_id ? undefined : `ML${(userIdHash % 5) + 1}`;

          // Determine author based on politician_id
          const author = postData.politician_id && postData.politicians
            ? postData.politicians.name
            : sampleNicknames[nicknameIndex];

          setPost({
            id: postData.id,
            title: postData.title,
            category: postData.politician_id ? '정치인 게시판' : '자유게시판',
            author: author,
            userId: postData.user_id,
            isPolitician: !!postData.politician_id,
            politicianStatus: postData.politicians?.status,
            politicianPosition: postData.politicians?.position,
            memberLevel: mlLevel,
            timestamp: formatDate(postData.created_at),
            views: postData.view_count || 0,
            commentCount: postData.comment_count || 0,
            shareCount: postData.share_count || 0,
            content: postData.content,
            // 태그된 정치인 정보 (관련 정치인 표시용)
            taggedPolitician: postData.politician_id && postData.politicians ? {
              id: postData.politician_id,
              name: postData.politicians.name,
              party: postData.politicians.party,
              position: postData.politicians.position,
            } : null,
          });

          setUpvotes(postData.upvotes || 0);
          setDownvotes(postData.downvotes || 0);
        }
      } catch (err) {
        console.error('[게시글 상세] 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  // Date format helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // Fetch comments from API (회원 댓글 + 정치인 댓글 합치기)
  useEffect(() => {
    const fetchComments = async () => {
      if (!params.id) return;

      try {
        setCommentsLoading(true);

        // 두 테이블에서 병렬로 댓글 조회
        const [userCommentsRes, politicianCommentsRes] = await Promise.all([
          fetch(`/api/comments?post_id=${params.id}&limit=100`),
          fetch(`/api/comments/politician?post_id=${params.id}`)
        ]);

        const userResult = userCommentsRes.ok ? await userCommentsRes.json() : { success: false, data: [] };
        const politicianResult = politicianCommentsRes.ok ? await politicianCommentsRes.json() : { success: false, data: [] };

        // Format date helper
        const formatCommentDate = (dateString: string) => {
          const date = new Date(dateString);
          return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        };

        // Map user comments
        const userComments: Comment[] = (userResult.success && userResult.data) ? userResult.data.map((comment: any, index: number) => {
          const userIdHash = comment.user_id ? comment.user_id.split('-')[0].charCodeAt(0) : index;
          const nicknameIndex = userIdHash % 10;
          const mlLevel = `ML${(userIdHash % 5) + 1}`;

          return {
            id: comment.id,
            author: comment.users?.name || sampleNicknames[nicknameIndex],
            userId: comment.user_id,
            authorType: 'member' as const,
            memberLevel: mlLevel,
            influenceLevel: '방랑자',
            timestamp: formatCommentDate(comment.created_at),
            rawTimestamp: comment.created_at,
            content: comment.content,
            upvotes: comment.upvotes || 0,
            downvotes: comment.downvotes || 0,
            isFollowing: false
          };
        }) : [];

        // Map politician comments
        const politicianComments: Comment[] = (politicianResult.success && politicianResult.data) ? politicianResult.data.map((comment: any) => {
          return {
            id: comment.id,
            author: comment.politician_name,
            userId: comment.politician_id,
            authorType: 'politician' as const,
            politicianStatus: '정치인',
            politicianPosition: '',
            timestamp: formatCommentDate(comment.created_at),
            rawTimestamp: comment.created_at,
            content: comment.content,
            upvotes: comment.upvotes || 0,
            downvotes: comment.downvotes || 0,
            isFollowing: false
          };
        }) : [];

        // 두 댓글 배열 합치고 시간순 정렬
        const allComments = [...userComments, ...politicianComments].sort((a: any, b: any) => {
          return new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime();
        });

        setComments(allComments);
        setTotalComments(allComments.length);
      } catch (err) {
        console.error('[게시글 상세] 댓글 조회 오류:', err);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [params.id]);

  // 댓글 목록 새로고침 함수 (공용)
  const refreshComments = useCallback(async () => {
    const formatCommentDate = (dateString: string) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const [userCommentsRes, politicianCommentsRes] = await Promise.all([
      fetch(`/api/comments?post_id=${params.id}&limit=100`),
      fetch(`/api/comments/politician?post_id=${params.id}`)
    ]);

    const userResult = userCommentsRes.ok ? await userCommentsRes.json() : { success: false, data: [] };
    const politicianResult = politicianCommentsRes.ok ? await politicianCommentsRes.json() : { success: false, data: [] };

    const userComments: Comment[] = (userResult.success && userResult.data) ? userResult.data.map((comment: any, index: number) => {
      const userIdHash = comment.user_id ? comment.user_id.split('-')[0].charCodeAt(0) : index;
      const nicknameIndex = userIdHash % 10;
      const mlLevel = `ML${(userIdHash % 5) + 1}`;

      return {
        id: comment.id,
        author: comment.users?.name || sampleNicknames[nicknameIndex],
        userId: comment.user_id,
        authorType: 'member' as const,
        memberLevel: mlLevel,
        influenceLevel: '방랑자',
        timestamp: formatCommentDate(comment.created_at),
        rawTimestamp: comment.created_at,
        content: comment.content,
        upvotes: comment.upvotes || 0,
        downvotes: comment.downvotes || 0,
        isFollowing: false
      };
    }) : [];

    const politicianComments: Comment[] = (politicianResult.success && politicianResult.data) ? politicianResult.data.map((comment: any) => {
      return {
        id: comment.id,
        author: comment.politician_name,
        userId: comment.politician_id,
        authorType: 'politician' as const,
        politicianStatus: '정치인',
        politicianPosition: '',
        timestamp: formatCommentDate(comment.created_at),
        rawTimestamp: comment.created_at,
        content: comment.content,
        upvotes: comment.upvotes || 0,
        downvotes: comment.downvotes || 0,
        isFollowing: false
      };
    }) : [];

    const allComments = [...userComments, ...politicianComments].sort((a: any, b: any) => {
      return new Date(a.rawTimestamp).getTime() - new Date(b.rawTimestamp).getTime();
    });

    setComments(allComments);
    setTotalComments(allComments.length);
  }, [params.id, sampleNicknames]);

  // MI7: 고정 댓글 입력창 제출 핸들러
  const handleCommentSubmit = useCallback(async (content: string) => {
    try {
      // /api/comments API 호출 (post_id 포함)
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: params.id, content })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetail = data.error?.details ? ` [${data.error.details}]` : '';
        throw new Error((data.error?.message || data.error || '댓글 등록에 실패했습니다.') + errorDetail);
      }

      // 댓글 목록 새로고침 (두 테이블 합쳐서)
      await refreshComments();

      setAlertMessage('댓글이 등록되었습니다.');
      setAlertModalOpen(true);
    } catch (error) {
      console.error('Comment submit error:', error);
      setAlertMessage(error instanceof Error ? error.message : '댓글 등록에 실패했습니다.');
      setAlertModalOpen(true);
      throw error;
    }
  }, [params.id, refreshComments]);

  // 정치인 본인 인증 핸들러 (이름 + 소속정당 + 출마직종)
  const handlePoliticianAuth = useCallback(async () => {
    if (!politicianAuthName.trim() || !politicianAuthParty || !politicianAuthPosition) {
      setAlertMessage('이름, 소속 정당, 출마직종을 모두 입력해주세요.');
      setAlertModalOpen(true);
      return;
    }

    setPoliticianAuthLoading(true);
    try {
      // 간편 인증 API 호출 (이름 + 소속정당 + 출마직종)
      const response = await fetch('/api/politicians/verify-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: politicianAuthName.trim(),
          party: politicianAuthParty,
          position: politicianAuthPosition
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || '정보가 일치하지 않습니다. 다시 확인해주세요.');
      }

      // 인증 성공
      setAuthenticatedPolitician({
        id: data.politician.id,
        name: data.politician.name
      });
      setPoliticianAuthModalOpen(false);
      setPoliticianAuthName('');
      setPoliticianAuthParty('');
      setPoliticianAuthPosition('');
      setAlertMessage(`${data.politician.name}님으로 인증되었습니다.`);
      setAlertModalOpen(true);
    } catch (error) {
      console.error('Politician auth error:', error);
      setAlertMessage(error instanceof Error ? error.message : '정보가 일치하지 않습니다. 다시 확인해주세요.');
      setAlertModalOpen(true);
    } finally {
      setPoliticianAuthLoading(false);
    }
  }, [politicianAuthName, politicianAuthParty, politicianAuthPosition]);

  // 정치인 댓글 제출 핸들러
  const handlePoliticianCommentSubmit = useCallback(async () => {
    if (!politicianCommentText.trim()) {
      setAlertMessage('댓글 내용을 입력해주세요.');
      setAlertModalOpen(true);
      return;
    }

    if (!authenticatedPolitician) {
      setPoliticianAuthModalOpen(true);
      return;
    }

    try {
      const response = await fetch('/api/comments/politician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: params.id,
          content: politicianCommentText.trim(),
          politician_id: authenticatedPolitician.id
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || '댓글 등록에 실패했습니다.');
      }

      // 댓글 목록 새로고침 (두 테이블 합쳐서)
      await refreshComments();

      setPoliticianCommentText('');
      setAlertMessage(`${authenticatedPolitician.name}님의 댓글이 등록되었습니다.`);
      setAlertModalOpen(true);
    } catch (error) {
      console.error('Politician comment submit error:', error);
      setAlertMessage(error instanceof Error ? error.message : '댓글 등록에 실패했습니다.');
      setAlertModalOpen(true);
    }
  }, [params.id, politicianCommentText, authenticatedPolitician, refreshComments]);

  // 게시글 삭제 핸들러
  const handleDeletePost = useCallback(async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || '게시글 삭제에 실패했습니다.');
      }

      setAlertMessage('게시글이 삭제되었습니다.');
      setAlertModalOpen(true);
      setDeleteModalOpen(false);

      // 삭제 후 목록으로 이동
      setTimeout(() => {
        router.push('/community');
      }, 1000);
    } catch (error) {
      console.error('Delete post error:', error);
      setAlertMessage(error instanceof Error ? error.message : '게시글 삭제에 실패했습니다.');
      setAlertModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  }, [params.id, router]);

  const handleUpvote = () => {
    if (upvoted) {
      setUpvotes(upvotes - 1);
      setUpvoted(false);
    } else {
      setUpvotes(upvotes + 1);
      setUpvoted(true);
      if (downvoted) {
        setDownvotes(downvotes - 1);
        setDownvoted(false);
      }
    }
  };

  const handleDownvote = () => {
    if (downvoted) {
      setDownvotes(downvotes - 1);
      setDownvoted(false);
    } else {
      setDownvotes(downvotes + 1);
      setDownvoted(true);
      if (upvoted) {
        setUpvotes(upvotes - 1);
        setUpvoted(false);
      }
    }
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const copyLinkToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showAlert('게시글 링크가 클립보드에 복사되었습니다.');
        setShareModalOpen(false);
      }).catch(() => {
        showAlert('링크 복사에 실패했습니다.');
      });
    }
  };

  const shareToFacebook = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    }
  };

  const shareToTwitter = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`, '_blank', 'width=600,height=400');
    }
  };

  const shareToNaverBlog = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      window.open(`https://blog.naver.com/openapi/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(post.title)}`, '_blank', 'width=600,height=500');
    }
  };

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/community" className="inline-flex items-center text-gray-600 hover:text-primary-600">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="text-gray-500 text-lg mt-4">게시글을 불러오는 중...</p>
          </div>
        ) : !post ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-2">⚠️ 게시글을 찾을 수 없습니다</p>
            <p className="text-gray-500 text-sm">존재하지 않거나 삭제된 게시글입니다.</p>
          </div>
        ) : (
          <>
            {/* Post Detail */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">💬 {post.category}</span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>

            {/* 작성자만 보이는 수정/삭제 버튼 */}
            {currentUser && post.userId === currentUser.id && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(`/community/posts/${params.id}/edit`)}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  수정
                </button>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* 정치인 태그 표시 */}
          {post.taggedPolitician && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-medium">🏛️ 관련 정치인:</span>
                <Link
                  href={`/politicians/${post.taggedPolitician.id}`}
                  className="text-orange-700 font-bold hover:underline"
                >
                  {post.taggedPolitician.name}
                </Link>
                {post.taggedPolitician.party && (
                  <span className="text-orange-600">({post.taggedPolitician.party})</span>
                )}
                {post.taggedPolitician.position && (
                  <span className="text-gray-500 text-sm">· {post.taggedPolitician.position}</span>
                )}
              </div>
            </div>
          )}

          <div className="border-b pb-4 mb-6">
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              {post.isPolitician ? (
                <>
                  <span className="font-medium text-primary-600">{post.author}</span>
                  <span className="text-gray-900">{post.politicianStatus} {post.politicianPosition}</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-secondary-600">{post.author}</span>
                  <span className="text-gray-900" aria-label={`활동 등급 ${post.memberLevel}`} title={`활동 등급: ${post.memberLevel}`}>{post.memberLevel}</span>
                  <span className="text-xs text-emerald-900 font-medium">{formatInfluenceGrade(0)}</span>
                  {post.userId && (
                    <FollowButton targetUserId={post.userId} size="sm" variant="outline" />
                  )}
                </>
              )}
              <span>{post.timestamp}</span>
              <span>조회수 {post.views}</span>
              <span className="text-red-600">👍 {upvotes}</span>
              <span className="text-gray-400">👎 {downvotes}</span>
              <span>댓글 {post.commentCount}</span>
              <button onClick={handleShare} className="flex items-center gap-1 hover:text-emerald-900">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>공유 {post.shareCount}</span>
              </button>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            {post.content.split('\n\n').map((paragraph: string, idx: number) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
              }
              return <p key={idx} className="text-gray-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br>') }} />;
            })}
          </div>

          <div className="flex items-center justify-center gap-4 py-6 border-t border-b">
            <button
              onClick={handleUpvote}
              className={`flex flex-col items-center gap-1 px-6 py-3 rounded-lg transition ${upvoted ? 'bg-red-100' : 'bg-red-50 hover:bg-red-100'}`}
            >
              <span className="text-2xl">👍</span>
              <span className="text-sm font-medium text-gray-700">공감 <span className="text-red-600">{upvotes}</span></span>
            </button>
            <button
              onClick={handleDownvote}
              className={`flex flex-col items-center gap-1 px-6 py-3 rounded-lg transition ${downvoted ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <span className="text-2xl">👎</span>
              <span className="text-sm font-medium text-gray-700">비공감 <span className="text-gray-500">{downvotes}</span></span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center gap-1 px-6 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
              <svg className="w-6 h-6 text-emerald-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">공유 <span className="text-emerald-900">{post.shareCount}</span></span>
            </button>
          </div>
        </article>

        {/* Comments Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">댓글 <span className="text-emerald-900">{post.commentCount}</span></h2>

          {/* 댓글 탭 */}
          {/* 정치인 게시판에만 정치인/회원 댓글 구분 표시 */}
          {post?.isPolitician ? (
            <>
              <div className="flex gap-2 mb-4">
                <button className="px-4 py-2 bg-primary-500 text-white rounded-lg border-2 border-primary-500 font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 transition">
                  🏛️ 정치인 댓글
                </button>
                <button className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-secondary-600 font-medium hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-secondary-300 transition">
                  👤 회원 댓글
                </button>
              </div>

              {/* 정치인 댓글 작성 폼 */}
              <div className="mb-4 p-4 bg-orange-50 border border-primary-200 rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-primary-600">🏛️ 정치인으로 댓글 작성</span>
                  {authenticatedPolitician ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary-600 font-medium">{authenticatedPolitician.name}님으로 인증됨</span>
                      <button
                        onClick={() => setAuthenticatedPolitician(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        (인증 해제)
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPoliticianAuthModalOpen(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
                    >
                      본인 인증하기
                    </button>
                  )}
                </div>
                <textarea
                  value={politicianCommentText}
                  onChange={(e) => setPoliticianCommentText(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder={authenticatedPolitician ? `${authenticatedPolitician.name}님으로 댓글을 입력하세요...` : "본인 인증 후 댓글을 입력할 수 있습니다."}
                  disabled={!authenticatedPolitician}
                />
                <div className="flex justify-end items-center mt-2">
                  <button
                    onClick={handlePoliticianCommentSubmit}
                    disabled={!politicianCommentText.trim() || !authenticatedPolitician}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    정치인 댓글 등록
                  </button>
                </div>
              </div>

              {/* 회원 댓글 작성 폼 */}
              <div className="mb-6 p-4 bg-purple-50 border border-secondary-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-secondary-600">👤 회원으로 댓글 작성</span>
                </div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 resize-none"
                  placeholder="회원으로 댓글을 입력하세요..."
                />
                <div className="flex justify-between items-center mt-2">
                  {currentUser ? (
                    <span className="text-sm text-secondary-600 font-medium">{currentUser.name || currentUser.email}님으로 댓글 작성</span>
                  ) : (
                    <span className="text-sm text-gray-500">회원 계정으로 로그인 필요</span>
                  )}
                  <button
                    onClick={() => {
                      if (commentText.trim()) {
                        handleCommentSubmit(commentText);
                        setCommentText('');
                      }
                    }}
                    disabled={!commentText.trim()}
                    className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    회원 댓글 등록
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* 회원 자유게시판 - 일반 댓글 작성 폼만 표시 */
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-gray-700">💬 댓글 작성</span>
                {currentUser ? (
                  <span className="text-sm text-secondary-600 font-medium">{currentUser.name || currentUser.email}님으로 작성</span>
                ) : (
                  <span className="text-sm text-gray-500">로그인 필요</span>
                )}
              </div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 resize-none"
                placeholder="댓글을 입력하세요..."
              />
              <div className="flex justify-end items-center mt-2">
                <button
                  onClick={() => {
                    if (commentText.trim()) {
                      handleCommentSubmit(commentText);
                      setCommentText('');
                    }
                  }}
                  disabled={!commentText.trim()}
                  className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  댓글 등록
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {comments.slice(0, displayedComments).map((comment) => (
              <div key={comment.id} className="border-b pb-4">
                <div className="mb-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    {/* 정치인 게시판에서만 정치인/회원 구분 표시 */}
                    {post?.isPolitician && comment.authorType === 'politician' ? (
                      <>
                        <Link href={`/politicians/${comment.userId}`} className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
                          {comment.author}
                        </Link>
                        <span className="text-gray-900">{comment.politicianStatus} {comment.politicianPosition}</span>
                      </>
                    ) : (
                      <>
                        <Link href={`/users/${comment.userId}/profile`} className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
                          {comment.author}
                        </Link>
                        <span className="text-gray-900" aria-label={`활동 등급 ${comment.memberLevel}`} title={`활동 등급: ${comment.memberLevel}`}>{comment.memberLevel}</span>
                        <span className="text-xs text-emerald-900 font-medium" aria-label={`영향력 등급 ${comment.influenceLevel}`} title={`영향력 등급: ${comment.influenceLevel}`}>🏰 {comment.influenceLevel}</span>
                        <button className="px-2 py-0.5 border border-emerald-700 text-emerald-900 rounded text-xs hover:bg-gray-50 transition">
                          + 팔로우
                        </button>
                      </>
                    )}
                    <span>{comment.timestamp}</span>
                    <span className="text-red-600">👍 {comment.upvotes}</span>
                    <span className="text-gray-400">👎 {comment.downvotes}</span>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{comment.content}</p>
              </div>
            ))}

            {comments.length > displayedComments && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setDisplayedComments(prev => prev + 10)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  댓글 더보기 ({comments.length - displayedComments}개 남음)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Other Posts */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">다른 게시글</h2>
          <div className="space-y-3">
            <Link href="/community/posts/1" className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">정치인 평가 시스템 정말 혁신적이네요</span>
                <span className="text-sm text-gray-500">👍 32</span>
              </div>
            </Link>
            <Link href="/community/posts/2" className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">우리 동네 복지센터 이용 후기</span>
                <span className="text-sm text-gray-500">👍 21</span>
              </div>
            </Link>
          </div>
        </section>
          </>
        )}
      </main>

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShareModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">게시글 공유하기</h2>
              <button onClick={() => setShareModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-6">{post.title}</p>
            <div className="space-y-3">
              <button onClick={copyLinkToClipboard} className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-left flex items-center gap-3 shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="font-medium">링크 복사</div>
              </button>
              <button onClick={shareToFacebook} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-left flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <div className="font-medium">Facebook에 공유</div>
              </button>
              <button onClick={shareToTwitter} className="w-full px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg text-left flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <div className="font-medium">X (Twitter)에 공유</div>
              </button>
              <button onClick={shareToNaverBlog} className="w-full px-4 py-3 bg-emerald-500 hover:bg-green-600 text-white rounded-lg text-left flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.273 12.845L7.376 0H0v24h7.726l8.898-12.845L24 24V0h-7.727z" />
                </svg>
                <div className="font-medium">네이버 블로그에 공유</div>
              </button>
            </div>
            <button onClick={() => setShareModalOpen(false)} className="mt-4 w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium">닫기</button>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setAlertModalOpen(false)}>
          <div className="bg-white rounded-lg max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6">
              <p className="text-gray-900 text-center whitespace-pre-line">{alertMessage}</p>
            </div>
            <div className="flex justify-center">
              <button onClick={() => setAlertModalOpen(false)} className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition">
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteModalOpen(false)}>
          <div className="bg-white rounded-lg max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">게시글 삭제</h3>
              <p className="text-gray-600">정말 이 게시글을 삭제하시겠습니까?</p>
              <p className="text-sm text-red-500 mt-1">삭제된 게시글은 복구할 수 없습니다.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    삭제 중...
                  </>
                ) : (
                  '삭제하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 정치인 본인 인증 모달 */}
      {politicianAuthModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setPoliticianAuthModalOpen(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">🏛️ 정치인 본인 인증</h2>
              <button onClick={() => setPoliticianAuthModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              본인 확인을 위해 아래 정보를 입력해주세요.
              시스템에 등록된 정보와 일치해야 인증됩니다.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="politician-name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="politician-name"
                  value={politicianAuthName}
                  onChange={(e) => setPoliticianAuthName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="politician-party" className="block text-sm font-medium text-gray-700 mb-1">
                  소속 정당 <span className="text-red-500">*</span>
                </label>
                <select
                  id="politician-party"
                  value={politicianAuthParty}
                  onChange={(e) => setPoliticianAuthParty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">정당을 선택하세요</option>
                  {PARTIES.map((party) => (
                    <option key={party} value={party}>{party}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="politician-position" className="block text-sm font-medium text-gray-700 mb-1">
                  출마직종 <span className="text-red-500">*</span>
                </label>
                <select
                  id="politician-position"
                  value={politicianAuthPosition}
                  onChange={(e) => setPoliticianAuthPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">출마직종을 선택하세요</option>
                  {POSITIONS.map((position) => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPoliticianAuthModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePoliticianAuth}
                disabled={politicianAuthLoading || !politicianAuthName.trim() || !politicianAuthParty || !politicianAuthPosition}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {politicianAuthLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    인증 중...
                  </>
                ) : (
                  '본인 인증하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MI7: 모바일 고정 댓글 입력창 */}
      <FixedCommentInput
        onSubmit={handleCommentSubmit}
        placeholder="의견을 남겨주세요..."
        mobileOnly={true}
        onLoginClick={() => router.push('/auth/login')}
      />

      {/* 하단 여백 (고정 댓글 입력창 공간 확보) */}
      <div className="h-20 md:h-0" />
    </div>
  );
}
