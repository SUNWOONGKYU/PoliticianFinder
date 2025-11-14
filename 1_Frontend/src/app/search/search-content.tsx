'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 정치인 타입
interface Politician {
  id: number;
  name: string;
  position: string;
  identity: string;  // P3F3: 신분
  title?: string;    // P3F3: 직책
  party: string;
  region: string;
  grade: string;
  totalScore: number;
  claudeScore: number;
  chatgptScore: number;
  geminiScore: number;
  grokScore: number;
  perplexityScore: number;
  memberRating: number;
  memberRatingCount: number;
  profileImage: string | null;
}

// 게시글 타입
interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  authorLink: string;
  memberLevel?: string;
  category: string;
  createdAt: string;
  views: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  shareCount: number;
}

// 샘플 정치인 데이터
const samplePoliticians: Politician[] = [
  {
    id: 1,
    name: '김민준',
    position: '국회의원',
    identity: '현직',
    party: '더불어민주당',
    region: '서울 강남구',
    grade: 'Emerald',
    totalScore: 84.8,
    claudeScore: 85.0,
    chatgptScore: 82.0,
    geminiScore: 87.0,
    grokScore: 84.0,
    perplexityScore: 86.0,
    memberRating: 4.0,
    memberRatingCount: 1247,
    profileImage: null,
  },
  {
    id: 2,
    name: '이서연',
    position: '국회의원',
    identity: '현직',
    party: '국민의힘',
    region: '부산 해운대구',
    grade: 'Platinum',
    totalScore: 92.3,
    claudeScore: 93.0,
    chatgptScore: 91.0,
    geminiScore: 94.0,
    grokScore: 91.0,
    perplexityScore: 93.0,
    memberRating: 4.5,
    memberRatingCount: 982,
    profileImage: null,
  },
];

// 샘플 정치인 게시글 데이터
const samplePoliticianPosts: Post[] = [
  {
    id: 1,
    title: '2025년 지역 발전 계획 공유드립니다',
    content: '우리 지역의 교통 인프라 개선과 청년 일자리 창출을 위한 구체적인 계획을 공유합니다...',
    author: '김민준 | 현직 국회의원',
    authorLink: '/politicians/1',
    category: 'politician_post',
    createdAt: '2025-01-28T09:00:00',
    views: 512,
    upvotes: 89,
    downvotes: 12,
    commentCount: 45,
    shareCount: 23,
  },
  {
    id: 2,
    title: '2024년 정책 성과 보고',
    content: '지난 1년간 추진한 주요 정책의 성과를 보고드립니다. 주민 여러분의 의견을 반영하여...',
    author: '이서연 | 현직 국회의원',
    authorLink: '/politicians/2',
    category: 'politician_post',
    createdAt: '2025-01-27T15:20:00',
    views: 387,
    upvotes: 67,
    downvotes: 8,
    commentCount: 32,
    shareCount: 15,
  },
];

// 샘플 회원 게시글 데이터
const sampleMemberPosts: Post[] = [
  {
    id: 3,
    title: '우리 지역 교통 문제 어떻게 생각하시나요?',
    content: '요즘 출퇴근 시간에 너무 막히는데, 다들 어떻게 생각하시나요? 좋은 해결책이 있을까요?',
    author: '박지민',
    authorLink: '/users/1/profile',
    memberLevel: 'Lv.3',
    category: 'general',
    createdAt: '2025-01-28T14:30:00',
    views: 234,
    upvotes: 45,
    downvotes: 3,
    commentCount: 28,
    shareCount: 7,
  },
  {
    id: 4,
    title: '청년 일자리 정책에 대한 제안',
    content: '청년으로서 느끼는 일자리 문제에 대해 이야기하고 싶습니다. 정치인들이 주목해주셨으면...',
    author: '최수영',
    authorLink: '/users/2/profile',
    memberLevel: 'Lv.4',
    category: 'proposal',
    createdAt: '2025-01-27T11:15:00',
    views: 456,
    upvotes: 78,
    downvotes: 5,
    commentCount: 41,
    shareCount: 12,
  },
];

export default function SearchContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('q') || '';

  const [filteredPoliticians, setFilteredPoliticians] = useState<Politician[]>([]);
  const [filteredPoliticianPosts, setFilteredPoliticianPosts] = useState<Post[]>([]);
  const [filteredMemberPosts, setFilteredMemberPosts] = useState<Post[]>([]);

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

  const performSearch = (query: string) => {
    if (!query) {
      setFilteredPoliticians([]);
      setFilteredPoliticianPosts([]);
      setFilteredMemberPosts([]);
      return;
    }

    // 정치인 검색
    const politicians = samplePoliticians.filter(
      (p) =>
        p.name.includes(query) || p.region.includes(query) || p.party.includes(query)
    );
    setFilteredPoliticians(politicians);

    // 정치인 게시글 검색
    const politicianPosts = samplePoliticianPosts.filter(
      (p) =>
        p.title.includes(query) || p.content.includes(query) || p.author.includes(query)
    );
    setFilteredPoliticianPosts(politicianPosts);

    // 회원 게시글 검색
    const memberPosts = sampleMemberPosts.filter(
      (p) =>
        p.title.includes(query) || p.content.includes(query) || p.author.includes(query)
    );
    setFilteredMemberPosts(memberPosts);
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 px-1">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;
  };

  const totalResults =
    filteredPoliticians.length + filteredPoliticianPosts.length + filteredMemberPosts.length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 검색 정보 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          '<span className="text-primary-600">{searchQuery}</span>' 검색 결과
        </h1>
        <p className="text-gray-600">
          총 <span className="font-bold text-primary-600">{totalResults}</span>건의 결과를
          찾았습니다.
        </p>
      </div>

      {/* 섹션 1: 정치인 검색 결과 */}
      <section className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-primary-200 bg-primary-50 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            정치인 <span className="text-primary-600">({filteredPoliticians.length})</span>
          </h2>
        </div>
        <div className="divide-y">
          {filteredPoliticians.length > 0 ? (
            filteredPoliticians.map((politician) => (
              <Link
                key={politician.id}
                href={`/politicians/${politician.id}`}
                className="block p-6 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {highlightSearchTerm(politician.name, searchQuery)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">
                        {politician.identity} {politician.title && `• ${politician.title}`}
                      </span>
                      <span>
                        {highlightSearchTerm(politician.party, searchQuery)}
                      </span>
                      <span>
                        {highlightSearchTerm(politician.region, searchQuery)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">검색 결과에 해당하는 정치인이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* 섹션 2: 정치인 게시글 검색 결과 */}
      <section className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-primary-200 bg-primary-50 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            정치인 게시글 <span className="text-primary-600">({filteredPoliticianPosts.length})</span>
          </h2>
        </div>
        <div className="divide-y">
          {filteredPoliticianPosts.length > 0 ? (
            filteredPoliticianPosts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition cursor-pointer">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {highlightSearchTerm(post.title, searchQuery)}
                </h3>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {highlightSearchTerm(post.content, searchQuery)}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Link href={post.authorLink} className="text-primary-600 hover:underline">
                      {post.author}
                    </Link>
                    <span>·</span>
                    <span>{formatDateTime(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>조회 {post.views}</span>
                    <span>좋아요 {post.upvotes}</span>
                    <span>댓글 {post.commentCount}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">검색 결과에 해당하는 정치인 게시글이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* 섹션 3: 회원 게시글 검색 결과 */}
      <section className="bg-white rounded-lg shadow-md">
        <div className="border-b border-primary-200 bg-primary-50 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            회원 게시글 <span className="text-primary-600">({filteredMemberPosts.length})</span>
          </h2>
        </div>
        <div className="divide-y">
          {filteredMemberPosts.length > 0 ? (
            filteredMemberPosts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50 transition cursor-pointer">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {highlightSearchTerm(post.title, searchQuery)}
                </h3>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {highlightSearchTerm(post.content, searchQuery)}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Link href={post.authorLink} className="text-primary-600 hover:underline">
                      {post.author} {post.memberLevel && `(${post.memberLevel})`}
                    </Link>
                    <span>·</span>
                    <span>{formatDateTime(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>조회 {post.views}</span>
                    <span>좋아요 {post.upvotes}</span>
                    <span>댓글 {post.commentCount}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">검색 결과에 해당하는 회원 게시글이 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
