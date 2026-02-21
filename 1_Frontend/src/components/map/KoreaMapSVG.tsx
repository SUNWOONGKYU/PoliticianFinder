'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 당 색상
const PARTY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  '더불어민주당':  { bg: '#1B4FBF', text: '#FFFFFF', ring: '#0D3A9E' },
  '국민의힘':      { bg: '#C9151E', text: '#FFFFFF', ring: '#A01018' },
  '조국혁신당':    { bg: '#003F87', text: '#FFFFFF', ring: '#002A5C' },
  '개혁신당':      { bg: '#FF7210', text: '#FFFFFF', ring: '#CC5A00' },
  '정의당':        { bg: '#F5C518', text: '#1F2937', ring: '#D4A800' },
  '진보당':        { bg: '#E83030', text: '#FFFFFF', ring: '#B52020' },
  '국민의당':      { bg: '#00C7AE', text: '#FFFFFF', ring: '#009E8C' },
  '무소속':        { bg: '#6B7280', text: '#FFFFFF', ring: '#4B5563' },
};
function getPartyColor(party: string) {
  return PARTY_COLORS[party] || { bg: '#9CA3AF', text: '#FFFFFF', ring: '#6B7280' };
}

// 17개 광역시도 SVG 좌표 (400×490 viewBox)
const METRO_REGIONS = [
  { id: '서울',  name: '서울특별시',     cx: 138, cy: 85,  r: 18 },
  { id: '인천',  name: '인천광역시',     cx: 95,  cy: 108, r: 17 },
  { id: '경기',  name: '경기도',         cx: 160, cy: 128, r: 22 },
  { id: '강원',  name: '강원특별자치도', cx: 252, cy: 90,  r: 22 },
  { id: '충북',  name: '충청북도',       cx: 212, cy: 172, r: 20 },
  { id: '세종',  name: '세종특별자치시', cx: 158, cy: 200, r: 14 },
  { id: '충남',  name: '충청남도',       cx: 105, cy: 198, r: 20 },
  { id: '대전',  name: '대전광역시',     cx: 172, cy: 220, r: 17 },
  { id: '경북',  name: '경상북도',       cx: 308, cy: 190, r: 22 },
  { id: '전북',  name: '전라북도',       cx: 148, cy: 270, r: 20 },
  { id: '대구',  name: '대구광역시',     cx: 282, cy: 258, r: 17 },
  { id: '경남',  name: '경상남도',       cx: 252, cy: 305, r: 22 },
  { id: '광주',  name: '광주광역시',     cx: 118, cy: 330, r: 17 },
  { id: '전남',  name: '전라남도',       cx: 138, cy: 362, r: 20 },
  { id: '울산',  name: '울산광역시',     cx: 345, cy: 292, r: 17 },
  { id: '부산',  name: '부산광역시',     cx: 322, cy: 330, r: 18 },
  { id: '제주',  name: '제주특별자치도', cx: 162, cy: 442, r: 22, isInset: true },
];

const REGION_FULL_NAMES: Record<string, string> = {
  '서울': '서울특별시', '인천': '인천광역시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '세종': '세종특별자치시',
  '충남': '충청남도', '대전': '대전광역시', '경북': '경상북도',
  '전북': '전북특별자치도', '대구': '대구광역시', '경남': '경상남도',
  '광주': '광주광역시', '전남': '전라남도', '울산': '울산광역시',
  '부산': '부산광역시', '제주': '제주특별자치도',
};

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

interface KoreaMapSVGProps {
  regionsData: RegionData[];
  positionType: string;
}

export default function KoreaMapSVG({ regionsData, positionType }: KoreaMapSVGProps) {
  const router = useRouter();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const dataMap = new Map<string, RegionData>();
  for (const r of regionsData) dataMap.set(r.region, r);

  const handleRegionClick = (regionId: string) => {
    const fullName = REGION_FULL_NAMES[regionId] || regionId;
    router.push(`/politicians?region=${encodeURIComponent(fullName)}&category=${encodeURIComponent(positionType)}`);
  };

  const hoveredData = hoveredRegion ? dataMap.get(hoveredRegion) : null;

  return (
    <div className="relative w-full">
      {/* 툴팁 */}
      {hoveredData && (
        <div className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-3 min-w-[190px] border border-gray-200 dark:border-gray-600 pointer-events-none">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            {REGION_FULL_NAMES[hoveredData.region] || hoveredData.region}
          </div>
          {/* 1위 */}
          {hoveredData.first ? (
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: getPartyColor(hoveredData.first.party).bg }}
              >1</div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{hoveredData.first.name}</div>
                <div className="text-[10px]" style={{ color: getPartyColor(hoveredData.first.party).bg }}>
                  {hoveredData.first.party} · {hoveredData.first.totalScore > 0 ? `${hoveredData.first.totalScore}점` : '미평가'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 mb-1.5">등록된 정치인 없음</div>
          )}
          {/* 2위 */}
          {hoveredData.second && (
            <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-700">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 opacity-80"
                style={{ backgroundColor: getPartyColor(hoveredData.second.party).bg }}
              >2</div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">{hoveredData.second.name}</div>
                <div className="text-[10px] text-gray-500" style={{ color: getPartyColor(hoveredData.second.party).bg }}>
                  {hoveredData.second.party} · {hoveredData.second.totalScore > 0 ? `${hoveredData.second.totalScore}점` : '미평가'}
                </div>
              </div>
            </div>
          )}
          <div className="mt-2 text-[9px] text-gray-400">클릭 → 지역 랭킹 이동</div>
        </div>
      )}

      {/* SVG 지도 */}
      <svg
        viewBox="0 0 400 490"
        className="w-full max-w-lg mx-auto"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
      >
        {/* 한반도 본토 윤곽 */}
        <path
          d="M 88,52 L 196,40 L 315,52 L 368,88 L 372,175 L 358,252 L 342,310 L 330,348
             L 290,368 L 245,376 L 190,378 L 142,368 L 95,345 L 55,318
             L 42,270 L 55,218 L 72,175 L 88,52 Z"
          fill="#E8EFF8"
          stroke="#C5D3E8"
          strokeWidth="2"
          className="dark:fill-gray-700 dark:stroke-gray-600"
        />

        {/* 제주도 구분선 */}
        <line x1="20" y1="405" x2="380" y2="405" stroke="#D1D9E0" strokeWidth="1" strokeDasharray="4,4" />
        <text x="200" y="400" textAnchor="middle" fontSize="7.5" fill="#9CA3AF">── 제주도 ──</text>

        {/* 제주도 윤곽 */}
        <ellipse
          cx="162" cy="442" rx="62" ry="22"
          fill="#E8EFF8" stroke="#C5D3E8" strokeWidth="2"
          className="dark:fill-gray-700 dark:stroke-gray-600"
        />

        {/* 지역 마커 */}
        {METRO_REGIONS.map((region) => {
          const data = dataMap.get(region.id);
          const first = data?.first;
          const second = data?.second;
          const c1 = getPartyColor(first?.party || '');
          const c2 = getPartyColor(second?.party || '');
          const isHovered = hoveredRegion === region.id;
          const r = region.r;
          const cx = region.cx;
          const cy = region.cy;

          return (
            <g
              key={region.id}
              onClick={() => handleRegionClick(region.id)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* hover 링 */}
              {isHovered && (
                <circle
                  cx={cx} cy={cy} r={r + 5}
                  fill="none"
                  stroke={first ? c1.bg : '#9CA3AF'}
                  strokeWidth="2" opacity="0.5"
                />
              )}

              {/* 2위가 있으면 좌(1위)/우(2위) 분할, 없으면 단색 */}
              {first && second ? (
                <>
                  {/* 좌반원: 1위 당색 */}
                  <path
                    d={`M ${cx},${cy - r} A ${r},${r} 0 0,0 ${cx},${cy + r} Z`}
                    fill={c1.bg}
                    stroke={c1.ring}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={isHovered ? 1 : 0.9}
                  />
                  {/* 우반원: 2위 당색 */}
                  <path
                    d={`M ${cx},${cy - r} A ${r},${r} 0 0,1 ${cx},${cy + r} Z`}
                    fill={c2.bg}
                    stroke={c2.ring}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={isHovered ? 1 : 0.9}
                  />
                  {/* 중앙 구분선 */}
                  <line
                    x1={cx} y1={cy - r} x2={cx} y2={cy + r}
                    stroke="white" strokeWidth="1.5" opacity="0.6"
                  />
                </>
              ) : (
                <circle
                  cx={cx} cy={cy} r={r}
                  fill={first ? c1.bg : '#D1D5DB'}
                  stroke={first ? c1.ring : '#9CA3AF'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  opacity={isHovered ? 1 : 0.88}
                />
              )}

              {/* 지역명 */}
              <text
                x={cx} y={cy - 3}
                textAnchor="middle"
                fontSize={region.id === '세종' ? 5.5 : 6.5}
                fontWeight="800"
                fill="white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                paintOrder="stroke"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="2"
              >
                {region.id}
              </text>

              {/* 1위 이름 (아래) */}
              {first && (
                <text
                  x={cx} y={cy + 7}
                  textAnchor="middle"
                  fontSize={5}
                  fill="white"
                  opacity={0.95}
                  paintOrder="stroke"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1.5"
                >
                  {first.name.length > 3 ? first.name.slice(0, 3) : first.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
