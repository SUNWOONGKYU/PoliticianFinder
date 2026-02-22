'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const KoreaMapSVG = dynamic(() => import('./KoreaMapSVG'), { ssr: false });

interface Politician {
  id: string;
  name: string;
  party: string;
  totalScore: number;
}

interface RegionData {
  region: string;
  district: string | null;
  first: Politician | null;
  second: Politician | null;
}

const PARTY_BG: Record<string, string> = {
  '더불어민주당': '#1B4FBF',
  '국민의힘':     '#C9151E',
  '조국혁신당':   '#003F87',
  '개혁신당':     '#FF7210',
  '정의당':       '#F5C518',
  '진보당':       '#E83030',
  '무소속':       '#6B7280',
};
function partyBg(party: string) { return PARTY_BG[party] || '#9CA3AF'; }
function partyText(party: string) { return party === '정의당' ? '#1F2937' : '#FFFFFF'; }

const REGION_FULL_NAMES: Record<string, string> = {
  '서울': '서울특별시', '인천': '인천광역시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '세종': '세종특별자치시',
  '충남': '충청남도', '대전': '대전광역시', '경북': '경상북도',
  '전북': '전북특별자치도', '대구': '대구광역시', '경남': '경상남도',
  '광주': '광주광역시', '전남': '전라남도', '울산': '울산광역시',
  '부산': '부산광역시', '제주': '제주특별자치도',
};

const METRO_ORDER = [
  '서울', '인천', '경기', '강원',
  '충남', '대전', '세종', '충북', '경북',
  '전북', '대구', '경남', '울산', '부산',
  '광주', '전남', '제주',
];

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapModal({ isOpen, onClose }: MapModalProps) {
  const router = useRouter();
  const [positionType, setPositionType] = useState<'광역단체장' | '기초단체장'>('광역단체장');
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async (type: string) => {
    if (fetched[type]) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/politicians/map?position_type=${encodeURIComponent(type)}`);
      const json = await res.json();
      if (json.success) {
        setRegionsData(json.regions || []);
        setFetched((prev) => ({ ...prev, [type]: true }));
      }
    } catch { /* 조용히 실패 */ }
    finally { setLoading(false); }
  }, [fetched]);

  useEffect(() => {
    if (isOpen) fetchData(positionType);
  }, [isOpen, positionType, fetchData]);

  // positionType 변경 시 새 데이터 로드
  useEffect(() => {
    if (isOpen && !fetched[positionType]) {
      setRegionsData([]);
      fetchData(positionType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionType]);

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const dataMap = new Map<string, RegionData>();
  for (const r of regionsData) dataMap.set(r.region, r);

  const orderedRegions = METRO_ORDER.map((id) => ({
    id,
    fullName: REGION_FULL_NAMES[id] || id,
    data: dataMap.get(id) || null,
  }));

  const handleCardClick = (fullName: string, district?: string | null) => {
    onClose();
    const params = new URLSearchParams({ region: fullName, category: positionType });
    if (district) params.set('district', district);
    router.push(`/politicians?${params}`);
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="지역별 랭킹 지도"
      >
        <div
          className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🗺️</span>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">지역별 랭킹 지도</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  AI 점수 기준 1위·2위 · 당색으로 구분 · 클릭하면 해당 지역 랭킹 이동
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {/* 토글 */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                {(['광역단체장', '기초단체장'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPositionType(type)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      positionType === type
                        ? 'bg-primary-500 text-white'
                        : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {/* 닫기 */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center h-60">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-9 h-9 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">데이터 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* 지도 패널 */}
                <div>
                  <KoreaMapSVG regionsData={regionsData} positionType={positionType} />
                  {/* 범례 */}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
                    {[
                      { label: '더불어민주당', color: '#1B4FBF' },
                      { label: '국민의힘', color: '#C9151E' },
                      { label: '조국혁신당', color: '#003F87' },
                      { label: '개혁신당', color: '#FF7210' },
                      { label: '기타/무소속', color: '#9CA3AF' },
                    ].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                    마커 좌측 = 1위 당색 · 우측 = 2위 당색
                  </p>
                </div>

                {/* 지역별 카드 목록 */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    {positionType} · 지역별 1위·2위
                  </p>
                  {positionType === '광역단체장' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {orderedRegions.map(({ id, fullName, data }) => {
                        const first = data?.first;
                        const second = data?.second;

                        return (
                          <button
                            key={id}
                            onClick={() => handleCardClick(fullName)}
                            className="text-left rounded-xl overflow-hidden shadow hover:shadow-md transition-all hover:scale-[1.03] active:scale-[0.97] w-full"
                          >
                            <div className="bg-gray-700 dark:bg-gray-900 px-2.5 py-1.5">
                              <span className="text-[10px] font-bold text-white">{fullName}</span>
                            </div>
                            <div className="px-2.5 py-2" style={{ backgroundColor: first ? partyBg(first.party) : '#E5E7EB' }}>
                              <div className="flex items-center justify-between gap-1">
                                <div className="min-w-0">
                                  <div className="text-[9px] font-medium opacity-75" style={{ color: first ? partyText(first.party) : '#6B7280' }}>🥇 1위</div>
                                  <div className="text-sm font-bold leading-tight truncate" style={{ color: first ? partyText(first.party) : '#6B7280' }}>{first ? first.name : '미등록'}</div>
                                  {first && <div className="text-[9px] opacity-80 truncate" style={{ color: partyText(first.party) }}>{first.party}</div>}
                                </div>
                                {first && first.totalScore > 0 && (
                                  <div className="text-right flex-shrink-0" style={{ color: partyText(first.party) }}>
                                    <div className="text-[9px] opacity-70">AI</div>
                                    <div className="text-xs font-bold">{first.totalScore}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="h-px bg-white/40" />
                            <div className="px-2.5 py-1.5" style={{ backgroundColor: second ? partyBg(second.party) + 'CC' : '#F3F4F6' }}>
                              {second ? (
                                <div className="flex items-center justify-between gap-1">
                                  <div className="min-w-0">
                                    <div className="text-[9px] font-medium opacity-75" style={{ color: partyText(second.party) }}>🥈 2위</div>
                                    <div className="text-xs font-semibold leading-tight truncate" style={{ color: partyText(second.party) }}>{second.name}</div>
                                    <div className="text-[9px] opacity-75 truncate" style={{ color: partyText(second.party) }}>{second.party}</div>
                                  </div>
                                  {second.totalScore > 0 && (
                                    <div className="text-right flex-shrink-0 text-[9px] font-bold" style={{ color: partyText(second.party) }}>{second.totalScore}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[9px] text-gray-400 py-0.5">2위 없음</div>
                              )}
                            </div>
                            <div className="bg-white dark:bg-slate-700 px-2.5 py-1">
                              <span className="text-[9px] text-gray-400 dark:text-gray-500">지역 랭킹 보기 →</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* 기초단체장: 구/시/군 단위로 표시 */
                    <div className="space-y-4">
                      {(['서울', '인천', '경기', '강원', '충남', '대전', '세종', '충북', '경북', '전북', '대구', '경남', '울산', '부산', '광주', '전남', '제주'] as const).map(provinceId => {
                        const provinceFull = REGION_FULL_NAMES[provinceId] || provinceId;
                        const districts = regionsData
                          .filter(r => r.region === provinceId || r.region === provinceFull)
                          .filter(r => r.first)
                          .sort((a, b) => (b.first?.totalScore || 0) - (a.first?.totalScore || 0));
                        if (districts.length === 0) return null;
                        return (
                          <div key={provinceId}>
                            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <span>📍</span>
                              <span>{provinceFull}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {districts.map(d => {
                                const first = d.first;
                                const second = d.second;
                                return (
                                  <button
                                    key={`${d.region}_${d.district}`}
                                    onClick={() => handleCardClick(provinceFull, d.district)}
                                    className="text-left rounded-xl overflow-hidden shadow hover:shadow-md transition-all hover:scale-[1.03] active:scale-[0.97] w-full"
                                  >
                                    <div className="bg-gray-700 dark:bg-gray-900 px-2.5 py-1.5">
                                      <span className="text-[10px] font-bold text-white">{d.district || provinceFull}</span>
                                    </div>
                                    <div className="px-2.5 py-2" style={{ backgroundColor: first ? partyBg(first.party) : '#E5E7EB' }}>
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="min-w-0">
                                          <div className="text-[9px] font-medium opacity-75" style={{ color: first ? partyText(first.party) : '#6B7280' }}>🥇 1위</div>
                                          <div className="text-sm font-bold leading-tight truncate" style={{ color: first ? partyText(first.party) : '#6B7280' }}>{first ? first.name : '미등록'}</div>
                                          {first && <div className="text-[9px] opacity-80 truncate" style={{ color: partyText(first.party) }}>{first.party}</div>}
                                        </div>
                                        {first && first.totalScore > 0 && (
                                          <div className="text-right flex-shrink-0" style={{ color: partyText(first.party) }}>
                                            <div className="text-[9px] opacity-70">AI</div>
                                            <div className="text-xs font-bold">{first.totalScore}</div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="h-px bg-white/40" />
                                    <div className="px-2.5 py-1.5" style={{ backgroundColor: second ? partyBg(second.party) + 'CC' : '#F3F4F6' }}>
                                      {second ? (
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="min-w-0">
                                            <div className="text-[9px] font-medium opacity-75" style={{ color: partyText(second.party) }}>🥈 2위</div>
                                            <div className="text-xs font-semibold leading-tight truncate" style={{ color: partyText(second.party) }}>{second.name}</div>
                                            <div className="text-[9px] opacity-75 truncate" style={{ color: partyText(second.party) }}>{second.party}</div>
                                          </div>
                                          {second.totalScore > 0 && (
                                            <div className="text-right flex-shrink-0 text-[9px] font-bold" style={{ color: partyText(second.party) }}>{second.totalScore}</div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-[9px] text-gray-400 py-0.5">2위 없음</div>
                                      )}
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 px-2.5 py-1">
                                      <span className="text-[9px] text-gray-400 dark:text-gray-500">지역 랭킹 보기 →</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {regionsData.filter(r => r.first).length === 0 && (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                          기초단체장 데이터가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
