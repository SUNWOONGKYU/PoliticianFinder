'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// SVG 지도는 클라이언트 전용 (SSR 제외)
const KoreaMapSVG = dynamic(() => import('@/components/map/KoreaMapSVG'), { ssr: false });

interface RegionData {
  region: string;
  district: string | null;
  topPolitician: {
    id: string;
    name: string;
    party: string;
    totalScore: number;
  } | null;
}

// 당 색상 배경색
const PARTY_BG: Record<string, string> = {
  '더불어민주당': '#1B4FBF',
  '국민의힘':     '#C9151E',
  '조국혁신당':   '#003F87',
  '개혁신당':     '#FF7210',
  '정의당':       '#F5C518',
  '진보당':       '#E83030',
  '무소속':       '#6B7280',
};

function partyBg(party: string) {
  return PARTY_BG[party] || '#9CA3AF';
}

const REGION_FULL_NAMES: Record<string, string> = {
  '서울': '서울특별시', '인천': '인천광역시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '세종': '세종특별자치시',
  '충남': '충청남도', '대전': '대전광역시', '경북': '경상북도',
  '전북': '전북특별자치도', '대구': '대구광역시', '경남': '경상남도',
  '광주': '광주광역시', '전남': '전라남도', '울산': '울산광역시',
  '부산': '부산광역시', '제주': '제주특별자치도',
};

// 광역 17개 지역 표시 순서 (지리적 순서)
const METRO_ORDER = [
  '서울', '인천', '경기', '강원',
  '충남', '대전', '세종', '충북', '경북',
  '전북', '대구', '경남', '울산', '부산',
  '광주', '전남', '제주',
];

export default function MapPage() {
  const [positionType, setPositionType] = useState<'광역단체장' | '기초단체장'>('광역단체장');
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/politicians/map?position_type=${encodeURIComponent(type)}`);
      const json = await res.json();
      if (json.success) {
        setRegionsData(json.regions || []);
      } else {
        setError('데이터를 불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(positionType);
  }, [positionType, fetchData]);

  // 지역 데이터 Map
  const dataMap = new Map<string, RegionData>();
  for (const r of regionsData) {
    dataMap.set(r.region, r);
  }

  const orderedRegions = METRO_ORDER.map((id) => ({
    id,
    fullName: REGION_FULL_NAMES[id] || id,
    data: dataMap.get(id) || null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="홈으로"
            >
              ← 홈
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🗺️ 지역별 랭킹 지도
            </h1>
          </div>

          {/* 출마직종 토글 */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            {(['광역단체장', '기초단체장'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPositionType(type)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  positionType === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 설명 */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          AI 평가 점수 기준 각 지역 {positionType} 1위 정치인을 표시합니다.
          마커를 클릭하면 해당 지역의 랭킹 페이지로 이동합니다.
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">데이터 불러오는 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-3">{error}</p>
              <button
                onClick={() => fetchData(positionType)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* 지도 패널 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 lg:sticky lg:top-4">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                전국 {positionType} AI 평가 1위
              </h2>
              <KoreaMapSVG
                regionsData={regionsData}
                positionType={positionType}
              />
              {/* 당 색상 범례 */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  { label: '더불어민주당', color: '#1B4FBF' },
                  { label: '국민의힘', color: '#C9151E' },
                  { label: '조국혁신당', color: '#003F87' },
                  { label: '개혁신당', color: '#FF7210' },
                  { label: '기타/무소속', color: '#9CA3AF' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 지역별 카드 목록 */}
            <div>
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                지역별 1위 정치인
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {orderedRegions.map(({ id, fullName, data }) => {
                  const pol = data?.topPolitician;
                  const bg = pol ? partyBg(pol.party) : '#E5E7EB';
                  const textColor = pol ? '#FFFFFF' : '#6B7280';
                  const params = new URLSearchParams({
                    region: fullName,
                    category: positionType,
                  });

                  return (
                    <Link
                      key={id}
                      href={`/politicians?${params.toString()}`}
                      className="block rounded-xl overflow-hidden shadow hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {/* 상단: 당 색상 배경 */}
                      <div
                        className="px-3 py-2.5"
                        style={{ backgroundColor: bg }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[10px] font-medium opacity-80" style={{ color: textColor }}>
                              {fullName}
                            </div>
                            <div className="text-sm font-bold mt-0.5" style={{ color: textColor }}>
                              {pol ? pol.name : '미등록'}
                            </div>
                          </div>
                          {pol && pol.totalScore > 0 && (
                            <div
                              className="text-right"
                              style={{ color: textColor }}
                            >
                              <div className="text-[10px] opacity-75">AI 점수</div>
                              <div className="text-sm font-bold">{pol.totalScore}</div>
                            </div>
                          )}
                        </div>
                        {pol && (
                          <div className="text-[10px] mt-1 opacity-80" style={{ color: textColor }}>
                            {pol.party}
                          </div>
                        )}
                      </div>
                      {/* 하단: 링크 안내 */}
                      <div className="bg-white dark:bg-slate-700 px-3 py-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          지역 랭킹 보기 →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {regionsData.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p>{positionType} 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
