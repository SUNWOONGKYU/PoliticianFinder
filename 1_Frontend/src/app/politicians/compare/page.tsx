/**
 * Project Grid Task ID: M6
 * 작업명: 정치인 비교하기 페이지
 * 생성시간: 2025-11-25
 * 생성자: Claude Code
 * 설명: 선택된 정치인들을 비교하는 페이지
 */

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface PoliticianData {
  id: string;
  name: string;
  party: string;
  region: string;
  identity: string;
  position: string;
  grade: string;
  gradeEmoji: string;
  totalScore: number;
  claudeScore: number;
  chatgptScore?: number;
  grokScore?: number;
  userRating: number;
  ratingCount: number;
  profileImageUrl?: string;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [politicians, setPoliticians] = useState<PoliticianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ids = useMemo(() => {
    const idsParam = searchParams.get('ids');
    return idsParam ? idsParam.split(',') : [];
  }, [searchParams]);

  useEffect(() => {
    const fetchPoliticians = async () => {
      if (ids.length < 2) {
        setError('비교할 정치인을 2명 이상 선택해주세요.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const responses = await Promise.all(
          ids.map(id => fetch(`/api/politicians/${id}`).then(res => res.json()))
        );

        const validData = responses
          .filter(res => res.success && res.data)
          .map(res => res.data);

        if (validData.length < 2) {
          setError('유효한 정치인 데이터를 찾을 수 없습니다.');
        } else {
          setPoliticians(validData);
        }
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPoliticians();
  }, [ids]);

  const getGradeDisplay = (grade: string) => {
    const gradeMap: Record<string, { emoji: string; name: string; color: string }> = {
      'M': { emoji: '🌺', name: 'Mugunghwa', color: 'text-pink-600' },
      'D': { emoji: '💎', name: 'Diamond', color: 'text-cyan-500' },
      'E': { emoji: '💚', name: 'Emerald', color: 'text-emerald-500' },
      'P': { emoji: '🥇', name: 'Platinum', color: 'text-gray-400' },
      'G': { emoji: '🥇', name: 'Gold', color: 'text-yellow-500' },
      'S': { emoji: '🥈', name: 'Silver', color: 'text-gray-400' },
      'B': { emoji: '🥉', name: 'Bronze', color: 'text-amber-600' },
      'I': { emoji: '⚫', name: 'Iron', color: 'text-gray-600' },
      'Tn': { emoji: '🪨', name: 'Tin', color: 'text-gray-500' },
      'L': { emoji: '⬛', name: 'Lead', color: 'text-gray-800' },
    };
    return gradeMap[grade] || { emoji: '❓', name: 'Unknown', color: 'text-gray-500' };
  };

  const getPartyColor = (party: string) => {
    const partyColors: Record<string, string> = {
      '더불어민주당': 'bg-blue-500',
      '국민의힘': 'bg-red-500',
      '정의당': 'bg-yellow-500',
      '무소속': 'bg-gray-500',
    };
    return partyColors[party] || 'bg-gray-400';
  };

  const getHighestScore = (field: 'totalScore' | 'claudeScore' | 'userRating') => {
    if (politicians.length === 0) return null;
    return Math.max(...politicians.map(p => p[field] || 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">정치인 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">오류 발생</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/politicians"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="뒤로 가기"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">정치인 비교</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{politicians.length}명의 정치인 비교 중</p>
              </div>
            </div>
            <Link
              href="/politicians"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              다시 선택하기
            </Link>
          </div>
        </div>
      </div>

      {/* Compare Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Cards Grid */}
        <div className={`grid gap-4 mb-8 ${
          politicians.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          politicians.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {politicians.map((p) => {
            const gradeInfo = getGradeDisplay(p.grade);
            const isHighestTotal = p.totalScore === getHighestScore('totalScore');
            const isHighestClaude = p.claudeScore === getHighestScore('claudeScore');
            const isHighestUser = p.userRating === getHighestScore('userRating');

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                {/* Profile Header */}
                <div className={`${getPartyColor(p.party)} h-2`} />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden relative">
                      {p.profileImageUrl ? (
                        <Image src={p.profileImageUrl} alt={p.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{p.party}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{p.identity} · {p.region}</p>
                    </div>
                  </div>

                  {/* Grade */}
                  <div className="text-center py-3 mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`text-2xl font-bold ${gradeInfo.color}`}>
                      {gradeInfo.emoji} {gradeInfo.name}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="space-y-3">
                    {/* Total Score */}
                    <div className={`p-3 rounded-lg ${isHighestTotal ? 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">종합 점수</span>
                        {isHighestTotal && <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">최고</span>}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{p.totalScore}점</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${(p.totalScore / 1000) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Claude Score */}
                    <div className={`p-3 rounded-lg ${isHighestClaude ? 'bg-accent-50 dark:bg-accent-900/30 ring-2 ring-accent-500' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Claude 평가</span>
                        {isHighestClaude && <span className="text-xs bg-accent-500 text-white px-2 py-0.5 rounded-full">최고</span>}
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{p.claudeScore}점</div>
                    </div>

                    {/* User Rating */}
                    <div className={`p-3 rounded-lg ${isHighestUser ? 'bg-secondary-50 dark:bg-secondary-900/30 ring-2 ring-secondary-500' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">회원 평가</span>
                        {isHighestUser && <span className="text-xs bg-secondary-500 text-white px-2 py-0.5 rounded-full">최고</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-secondary-600">
                          {'★'.repeat(Math.floor(p.userRating))}
                          {'☆'.repeat(5 - Math.floor(p.userRating))}
                        </span>
                        <span className="text-sm text-gray-500">({p.ratingCount}명)</span>
                      </div>
                    </div>
                  </div>

                  {/* View Detail Button */}
                  <Link
                    href={`/politicians/${p.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm"
                  >
                    상세 보기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table (Desktop) */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">상세 비교</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">항목</th>
                  {politicians.map(p => (
                    <th key={p.id} className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">정당</td>
                  {politicians.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{p.party}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">지역</td>
                  {politicians.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{p.region}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">신분</td>
                  {politicians.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{p.identity}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">평가 등급</td>
                  {politicians.map(p => {
                    const gradeInfo = getGradeDisplay(p.grade);
                    return (
                      <td key={p.id} className={`px-4 py-3 text-center text-sm font-bold ${gradeInfo.color}`}>
                        {gradeInfo.emoji} {gradeInfo.name}
                      </td>
                    );
                  })}
                </tr>
                <tr className="bg-primary-50 dark:bg-primary-900/20">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">종합 점수</td>
                  {politicians.map(p => (
                    <td key={p.id} className={`px-4 py-3 text-center text-lg font-bold ${
                      p.totalScore === getHighestScore('totalScore') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {p.totalScore}점
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Claude 평가</td>
                  {politicians.map(p => (
                    <td key={p.id} className={`px-4 py-3 text-center text-sm font-bold ${
                      p.claudeScore === getHighestScore('claudeScore') ? 'text-accent-600 dark:text-accent-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {p.claudeScore}점
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">회원 평가</td>
                  {politicians.map(p => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${
                        p.userRating === getHighestScore('userRating') ? 'text-secondary-600 dark:text-secondary-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {'★'.repeat(Math.floor(p.userRating))}
                        {'☆'.repeat(5 - Math.floor(p.userRating))}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">({p.ratingCount}명)</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
