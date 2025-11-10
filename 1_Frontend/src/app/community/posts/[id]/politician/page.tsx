'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Comment {
  id: number;
  author: string;
  authorType: 'politician' | 'member';
  userId?: string;
  politicianId?: number;
  memberLevel?: string;
  influenceLevel?: string;
  politicianPosition?: string;
  timestamp: string;
  content: string;
  upvotes: number;
  downvotes: number;
}

export default function PoliticianPostDetailPage({ params }: { params: { id: string } }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [politicianCommentText, setPoliticianCommentText] = useState('');
  const [memberCommentText, setMemberCommentText] = useState('');
  const [commentFilter, setCommentFilter] = useState<'all' | 'politician' | 'member'>('all');
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(89);
  const [downvotes, setDownvotes] = useState(12);

  const post = {
    id: params.id,
    title: '2025년 지역 발전 계획 공유드립니다',
    category: '정치인 글',
    author: '김민준 의원',
    timestamp: '2025.10.25 09:00',
    views: 512,
    commentCount: 45,
    shareCount: 23,
    content: `안녕하세요, 김민준 의원입니다.

우리 지역의 발전을 위한 2025년 계획을 공유드립니다. 주민 여러분의 의견을 적극 수렴하여 만든 계획이니 많은 관심과 의견 부탁드립니다.

## 1. 교통 인프라 개선

• 지하철 연장선 착공 예정
• 버스 노선 재편 및 증편
• 주차 공간 확충 사업

## 2. 청년 일자리 창출

• 청년 창업 지원센터 설립
• 지역 기업 취업 장려금 지원
• IT 산업 유치 활동

## 3. 교육 환경 개선

• 노후 학교 시설 개선
• 방과후 프로그램 확대
• 무상급식 품질 향상

주민 여러분의 소중한 의견을 듣고 싶습니다. 댓글로 자유롭게 의견을 남겨주세요.`
  };

  const [comments] = useState<Comment[]>([
    {
      id: 1,
      author: '김민준 의원',
      authorType: 'politician',
      politicianId: 1,
      politicianPosition: '국회의원',
      timestamp: '2025.10.25 14:20',
      content: '주민 여러분의 소중한 의견 감사합니다. 모든 의견을 적극 반영하여 더 나은 정책을 만들어가겠습니다. 특히 교통 인프라는 최우선 과제로 추진하고 있으니 조금만 기다려주시기 바랍니다.',
      upvotes: 45,
      downvotes: 2
    },
    {
      id: 2,
      author: '시민123',
      authorType: 'member',
      userId: 'user_001',
      memberLevel: 'ML4',
      influenceLevel: '영주',
      timestamp: '2025.10.25 10:30',
      content: '교통 인프라 개선 정말 필요했습니다! 특히 지하철 연장선은 우리 지역 주민들이 오래 기다려온 사업이에요. 빠른 진행 부탁드립니다.',
      upvotes: 12,
      downvotes: 1
    },
    {
      id: 3,
      author: '정치관심러',
      authorType: 'member',
      userId: 'user_002',
      memberLevel: 'ML3',
      influenceLevel: '영주',
      timestamp: '2025.10.25 11:15',
      content: '청년 일자리 창출 정책 좋네요. 구체적인 예산과 일정도 공개해주시면 더 신뢰가 갈 것 같습니다.',
      upvotes: 8,
      downvotes: 0
    },
    {
      id: 4,
      author: '학부모',
      authorType: 'member',
      userId: 'user_003',
      memberLevel: 'ML2',
      influenceLevel: '영주',
      timestamp: '2025.10.25 12:00',
      content: '교육 환경 개선에 대한 구체적인 계획 감사합니다. 특히 노후 학교 시설 개선은 시급한 문제입니다. 우리 아이 학교도 꼭 포함되었으면 좋겠어요.',
      upvotes: 15,
      downvotes: 2
    }
  ]);

  const filteredComments = comments.filter(comment => {
    if (commentFilter === 'all') return true;
    return comment.authorType === commentFilter;
  });

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

  const handleCommentFilter = (filter: 'all' | 'politician' | 'member') => {
    setCommentFilter(filter);
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

        {/* Post Detail */}
        <article className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded">🏛️ {post.category}</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

          <div className="border-b pb-4 mb-6">
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="font-medium text-primary-600">{post.author}</span>
              <span>{post.timestamp}</span>
              <span>조회수 {post.views}</span>
              <span className="text-red-600">👍 {upvotes}</span>
              <span className="text-gray-400">👎 {downvotes}</span>
              <span>댓글 {post.commentCount}</span>
              <button onClick={handleShare} className="flex items-center gap-1 hover:text-primary-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>공유 {post.shareCount}</span>
              </button>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            {post.content.split('\n\n').map((paragraph, idx) => {
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
            <button onClick={handleShare} className="flex flex-col items-center gap-1 px-6 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm12 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">공유 <span className="text-primary-600">{post.shareCount}</span></span>
            </button>
          </div>
        </article>

        {/* Comments Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">댓글 <span className="text-primary-600">{post.commentCount}</span></h2>

          {/* Comment Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => handleCommentFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                commentFilter === 'all' ? 'bg-gray-200 text-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              전체 댓글
            </button>
            <button
              onClick={() => handleCommentFilter('politician')}
              className={`px-4 py-2 rounded-lg border-2 border-primary-500 font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                commentFilter === 'politician' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700 hover:bg-primary-50'
              }`}
            >
              🏛️ 정치인 댓글
            </button>
            <button
              onClick={() => handleCommentFilter('member')}
              className={`px-4 py-2 rounded-lg border-2 border-purple-600 font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                commentFilter === 'member' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-emerald-50'
              }`}
            >
              👤 회원 댓글
            </button>
          </div>

          {/* 정치인 댓글 등록 폼 */}
          <div id="politician-comment-form" className="mb-4 p-4 bg-orange-50 border border-primary-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-primary-600">🏛️ 정치인으로 댓글 작성</span>
            </div>
            <textarea
              value={politicianCommentText}
              onChange={(e) => setPoliticianCommentText(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="정치인으로 댓글을 입력하세요..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">정치인 본인 인증 필요</span>
              <button
                onClick={() => setVerifyModalOpen(true)}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition"
              >
                정치인 댓글 등록
              </button>
            </div>
          </div>

          {/* 회원 댓글 등록 폼 */}
          <div id="member-comment-form" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-emerald-900">👤 회원으로 댓글 작성</span>
            </div>
            <textarea
              value={memberCommentText}
              onChange={(e) => setMemberCommentText(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-emerald-500 resize-none"
              placeholder="회원으로 댓글을 입력하세요..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">회원 계정으로 로그인 필요</span>
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition">
                회원 댓글 등록
              </button>
            </div>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="border-b pb-4">
                <div className="mb-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    {comment.authorType === 'politician' ? (
                      <>
                        <span className="font-medium text-primary-600">🏛️ {comment.author}</span>
                        <span className="text-primary-600">{comment.politicianPosition}</span>
                      </>
                    ) : (
                      <>
                        <Link href={`/users/${comment.userId}/profile`} className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
                          👤 {comment.author}
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

            <div className="text-center pt-4">
              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                댓글 더보기 (42개 남음)
              </button>
            </div>
          </div>
        </section>

        {/* Other Posts */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">다른 게시글</h2>
          <div className="space-y-3">
            <Link href="/community/posts/1/politician" className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">2024년 정책 성과 보고</span>
                <span className="text-sm text-gray-500">👍 67</span>
              </div>
            </Link>
            <Link href="/community/posts/2/politician" className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">주민과의 대화 일정 공지</span>
                <span className="text-sm text-gray-500">👍 43</span>
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* Politician Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setVerifyModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">정치인 본인 인증</h3>
              <button onClick={() => setVerifyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">정치인으로 댓글을 작성하려면 본인 인증이 필요합니다.</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="verify-name" className="block text-sm font-medium text-gray-900 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="verify-name"
                  placeholder="정치인 이름"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="verify-party" className="block text-sm font-medium text-gray-900 mb-2">
                  소속 정당 <span className="text-red-500">*</span>
                </label>
                <select
                  id="verify-party"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">선택하세요</option>
                  <option value="더불어민주당">더불어민주당</option>
                  <option value="국민의힘">국민의힘</option>
                  <option value="조국혁신당">조국혁신당</option>
                  <option value="무소속">무소속</option>
                </select>
              </div>

              <div>
                <label htmlFor="verify-position" className="block text-sm font-medium text-gray-900 mb-2">
                  출마직종 <span className="text-red-500">*</span>
                </label>
                <select
                  id="verify-position"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">선택하세요</option>
                  <option value="국회의원">국회의원</option>
                  <option value="광역단체장">광역단체장</option>
                  <option value="광역의원">광역의원</option>
                  <option value="기초단체장">기초단체장</option>
                  <option value="기초의원">기초의원</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setVerifyModalOpen(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    showAlert('본인 인증이 완료되었습니다.');
                    setVerifyModalOpen(false);
                  }}
                  className="flex-1 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
                >
                  인증하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
