'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 당 색상 (배경색, 텍스트색)
const PARTY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  '더불어민주당':  { bg: '#1B4FBF', text: '#FFFFFF', ring: '#0D3A9E' },
  '국민의힘':      { bg: '#C9151E', text: '#FFFFFF', ring: '#A01018' },
  '조국혁신당':    { bg: '#003F87', text: '#FFFFFF', ring: '#002A5C' },
  '개혁신당':      { bg: '#FF7210', text: '#FFFFFF', ring: '#CC5A00' },
  '정의당':        { bg: '#F5C518', text: '#1F2937', ring: '#D4A800' },
  '진보당':        { bg: '#E83030', text: '#FFFFFF', ring: '#B52020' },
  '국민의당':      { bg: '#00C7AE', text: '#FFFFFF', ring: '#009E8C' },
  '기본소득당':    { bg: '#8B5CF6', text: '#FFFFFF', ring: '#6D28D9' },
  '사회민주당':    { bg: '#059669', text: '#FFFFFF', ring: '#047857' },
  '무소속':        { bg: '#6B7280', text: '#FFFFFF', ring: '#4B5563' },
};

function getPartyColor(party: string) {
  return PARTY_COLORS[party] || { bg: '#9CA3AF', text: '#FFFFFF', ring: '#6B7280' };
}

// 전국 17개 광역시도 SVG 좌표 (400×480 viewBox 기준, 실제 지리 좌표 기반)
// 기준: 서경 125.5°~130°, 북위 34°~38.5°
const METRO_REGIONS = [
  { id: '서울',  name: '서울특별시',   cx: 138, cy: 85,  r: 18 },
  { id: '인천',  name: '인천광역시',   cx: 95,  cy: 108, r: 17 },
  { id: '경기',  name: '경기도',       cx: 160, cy: 128, r: 22 },
  { id: '강원',  name: '강원특별자치도', cx: 252, cy: 90, r: 22 },
  { id: '충북',  name: '충청북도',     cx: 212, cy: 172, r: 20 },
  { id: '세종',  name: '세종특별자치시', cx: 158, cy: 200, r: 14 },
  { id: '충남',  name: '충청남도',     cx: 105, cy: 198, r: 20 },
  { id: '대전',  name: '대전광역시',   cx: 172, cy: 220, r: 17 },
  { id: '경북',  name: '경상북도',     cx: 308, cy: 190, r: 22 },
  { id: '전북',  name: '전라북도',     cx: 148, cy: 270, r: 20 },
  { id: '대구',  name: '대구광역시',   cx: 282, cy: 258, r: 17 },
  { id: '경남',  name: '경상남도',     cx: 252, cy: 305, r: 22 },
  { id: '광주',  name: '광주광역시',   cx: 118, cy: 330, r: 17 },
  { id: '전남',  name: '전라남도',     cx: 138, cy: 362, r: 20 },
  { id: '울산',  name: '울산광역시',   cx: 345, cy: 292, r: 17 },
  { id: '부산',  name: '부산광역시',   cx: 322, cy: 330, r: 18 },
  { id: '제주',  name: '제주특별자치도', cx: 162, cy: 442, r: 22, isInset: true },
];

// 지역 fullName -> 단축명 매핑 (politicians 페이지 URL 파라미터용)
const REGION_FULL_NAMES: Record<string, string> = {
  '서울': '서울특별시',
  '인천': '인천광역시',
  '경기': '경기도',
  '강원': '강원특별자치도',
  '충북': '충청북도',
  '세종': '세종특별자치시',
  '충남': '충청남도',
  '대전': '대전광역시',
  '경북': '경상북도',
  '전북': '전북특별자치도',
  '대구': '대구광역시',
  '경남': '경상남도',
  '광주': '광주광역시',
  '전남': '전라남도',
  '울산': '울산광역시',
  '부산': '부산광역시',
  '제주': '제주특별자치도',
};

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

interface KoreaMapSVGProps {
  regionsData: RegionData[];
  positionType: string;
}

export default function KoreaMapSVG({ regionsData, positionType }: KoreaMapSVGProps) {
  const router = useRouter();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // 지역 데이터 Map
  const dataMap = new Map<string, RegionData>();
  for (const r of regionsData) {
    dataMap.set(r.region, r);
  }

  const handleRegionClick = (regionId: string) => {
    const fullName = REGION_FULL_NAMES[regionId] || regionId;
    const params = new URLSearchParams({
      region: fullName,
      category: positionType,
    });
    router.push(`/politicians?${params.toString()}`);
  };

  const hoveredData = hoveredRegion ? dataMap.get(hoveredRegion) : null;

  return (
    <div className="relative w-full">
      {/* 툴팁 */}
      {hoveredData && (
        <div className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 min-w-[200px] border border-gray-200 dark:border-gray-600 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getPartyColor(hoveredData.topPolitician?.party || '').bg }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {REGION_FULL_NAMES[hoveredData.region] || hoveredData.region}
            </span>
          </div>
          {hoveredData.topPolitician ? (
            <>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {hoveredData.topPolitician.name}
              </div>
              <div
                className="text-sm font-medium mt-0.5"
                style={{ color: getPartyColor(hoveredData.topPolitician.party).bg }}
              >
                {hoveredData.topPolitician.party}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">AI 평가</span>
                <span className="text-sm font-bold text-primary-600">
                  {hoveredData.topPolitician.totalScore > 0
                    ? `${hoveredData.topPolitician.totalScore}점`
                    : '미평가'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">등록된 정치인 없음</div>
          )}
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">클릭하면 랭킹 페이지로 이동</div>
        </div>
      )}

      {/* SVG 지도 */}
      <svg
        viewBox="0 0 400 490"
        className="w-full max-w-lg mx-auto"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
      >
        {/* 배경 */}
        <rect width="400" height="490" fill="transparent" />

        {/* 한반도 본토 윤곽선 (간략화된 South Korea outline) */}
        <path
          d="M 88,52 L 196,40 L 315,52 L 368,88 L 372,175 L 358,252 L 342,310 L 330,348
             L 290,368 L 245,376 L 190,378 L 142,368 L 95,345 L 55,318
             L 42,270 L 55,218 L 72,175 L 88,52 Z"
          fill="#E8EFF8"
          stroke="#C5D3E8"
          strokeWidth="2"
          className="dark:fill-gray-700 dark:stroke-gray-600"
        />

        {/* 제주도 본토와 구분선 */}
        <line
          x1="20" y1="405"
          x2="380" y2="405"
          stroke="#D1D9E0"
          strokeWidth="1"
          strokeDasharray="5,5"
          className="dark:stroke-gray-600"
        />
        <text x="200" y="400" textAnchor="middle" fontSize="8" fill="#9CA3AF" className="dark:fill-gray-500">
          ───── 제주도 ─────
        </text>

        {/* 제주도 윤곽 */}
        <ellipse
          cx="162" cy="442"
          rx="62" ry="22"
          fill="#E8EFF8"
          stroke="#C5D3E8"
          strokeWidth="2"
          className="dark:fill-gray-700 dark:stroke-gray-600"
        />

        {/* 지역 마커 */}
        {METRO_REGIONS.map((region) => {
          const data = dataMap.get(region.id);
          const politician = data?.topPolitician;
          const partyColor = getPartyColor(politician?.party || '');
          const isHovered = hoveredRegion === region.id;
          const hasData = !!politician;

          return (
            <g
              key={region.id}
              onClick={() => handleRegionClick(region.id)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* 외곽 링 (hover 효과) */}
              {isHovered && (
                <circle
                  cx={region.cx}
                  cy={region.cy}
                  r={region.r + 5}
                  fill="none"
                  stroke={hasData ? partyColor.bg : '#9CA3AF'}
                  strokeWidth="2"
                  opacity="0.5"
                />
              )}

              {/* 메인 원 */}
              <circle
                cx={region.cx}
                cy={region.cy}
                r={region.r}
                fill={hasData ? partyColor.bg : '#D1D5DB'}
                stroke={hasData ? partyColor.ring : '#9CA3AF'}
                strokeWidth={isHovered ? 2.5 : 1.5}
                opacity={isHovered ? 1 : 0.88}
              />

              {/* 지역명 */}
              <text
                x={region.cx}
                y={region.cy - 3}
                textAnchor="middle"
                fontSize={region.id === '세종' ? 6 : 7}
                fontWeight="700"
                fill={hasData ? partyColor.text : '#6B7280'}
              >
                {region.id}
              </text>

              {/* 정치인명 */}
              {politician && (
                <text
                  x={region.cx}
                  y={region.cy + 7}
                  textAnchor="middle"
                  fontSize={6}
                  fill={partyColor.text}
                  opacity={0.9}
                >
                  {politician.name.length > 4 ? politician.name.slice(0, 4) : politician.name}
                </text>
              )}
            </g>
          );
        })}

        {/* 범례 */}
        <g transform="translate(5, 415)">
          <text x="0" y="8" fontSize="7" fill="#6B7280" className="dark:fill-gray-400">■</text>
          <text x="10" y="8" fontSize="7" fill="#1B4FBF">민주</text>
          <text x="32" y="8" fontSize="7" fill="#C9151E">■</text>
          <text x="42" y="8" fontSize="7" fill="#C9151E">국힘</text>
          <text x="64" y="8" fontSize="7" fill="#6B7280">■</text>
          <text x="74" y="8" fontSize="7" fill="#6B7280">기타</text>
        </g>
      </svg>
    </div>
  );
}
