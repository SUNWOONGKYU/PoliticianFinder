'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// southkorea-maps kostat 2018 GeoJSON (250 municipalities)
// properties: { code: '11010', name_eng: 'Jongno-gu', base_year: '2018' }
// code 앞 2자리 = 시도 코드
const GEO_URL =
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json';

// 행정코드 앞 2자리 → 시도 풀네임
const PROVINCE_CODE_MAP: Record<string, string> = {
  '11': '서울특별시',
  '21': '부산광역시',
  '22': '대구광역시',
  '23': '인천광역시',
  '24': '광주광역시',
  '25': '대전광역시',
  '26': '울산광역시',
  '29': '세종특별자치시',
  '31': '경기도',
  '32': '강원특별자치도',
  '33': '충청북도',
  '34': '충청남도',
  '35': '전북특별자치도',
  '36': '전라남도',
  '37': '경상북도',
  '38': '경상남도',
  '39': '제주특별자치도',
};

// 영문 district명 → 한국어 district명 매핑
// GeoJSON name_eng → DB district 필드 매칭
const ENG_TO_KOR_DISTRICT: Record<string, string> = {
  // 서울 (11)
  'Jongno-gu': '종로구', 'Jung-gu': '중구', 'Yongsan-gu': '용산구',
  'Seongdong-gu': '성동구', 'Gwangjin-gu': '광진구', 'Dongdaemun-gu': '동대문구',
  'Jungnang-gu': '중랑구', 'Seongbuk-gu': '성북구', 'Gangbuk-gu': '강북구',
  'Dobong-gu': '도봉구', 'Nowon-gu': '노원구', 'Eunpyeong-gu': '은평구',
  'Seodaemun-gu': '서대문구', 'Mapo-gu': '마포구', 'Yangcheon-gu': '양천구',
  'Gangseo-gu': '강서구', 'Guro-gu': '구로구', 'Geumcheon-gu': '금천구',
  'Yeongdeungpo-gu': '영등포구', 'Dongjak-gu': '동작구', 'Gwanak-gu': '관악구',
  'Seocho-gu': '서초구', 'Gangnam-gu': '강남구', 'Songpa-gu': '송파구',
  'Gangdong-gu': '강동구',
  // 부산 (21)
  'Seo-gu': '서구', 'Dong-gu': '동구', 'Yeongdo-gu': '영도구',
  'Busanjin-gu': '부산진구', 'Dongnae-gu': '동래구', 'Nam-gu': '남구',
  'Buk-gu': '북구', 'Haeundae-gu': '해운대구', 'Saha-gu': '사하구',
  'Geumjeong-gu': '금정구', 'Yeonje-gu': '연제구', 'Suyeong-gu': '수영구',
  'Sasang-gu': '사상구', 'Gijang-gun': '기장군',
  // 대구 (22)
  'Suseong-gu': '수성구', 'Dalseo-gu': '달서구', 'Dalseong-gun': '달성군',
  // 인천 (23)
  'Michuhol-gu': '미추홀구', 'Yeonsu-gu': '연수구', 'Namdong-gu': '남동구',
  'Bupyeong-gu': '부평구', 'Gyeyang-gu': '계양구', 'Ganghwa-gun': '강화군',
  'Ongjin-gun': '옹진군',
  // 광주 (24)
  'Gwangsan-gu': '광산구',
  // 대전 (25)
  'Yuseong-gu': '유성구', 'Daedeok-gu': '대덕구',
  // 울산 (26)
  'Ulju-gun': '울주군',
  // 세종 (29)
  'Sejong-si': '세종시',
  // 경기 (31)
  'Suwon-si': '수원시', 'Seongnam-si': '성남시', 'Uijeongbu-si': '의정부시',
  'Anyang-si': '안양시', 'Bucheon-si': '부천시', 'Gwangmyeong-si': '광명시',
  'Pyeongtaek-si': '평택시', 'Dongducheon-si': '동두천시', 'Ansan-si': '안산시',
  'Goyang-si': '고양시', 'Gwacheon-si': '과천시', 'Guri-si': '구리시',
  'Namyangju-si': '남양주시', 'Osan-si': '오산시', 'Siheung-si': '시흥시',
  'Gunpo-si': '군포시', 'Uiwang-si': '의왕시', 'Hanam-si': '하남시',
  'Yongin-si': '용인시', 'Paju-si': '파주시', 'Icheon-si': '이천시',
  'Anseong-si': '안성시', 'Gimpo-si': '김포시', 'Hwaseong-si': '화성시',
  'Gwangju-si': '광주시', 'Yangju-si': '양주시', 'Pocheon-si': '포천시',
  'Yeoju-si': '여주시', 'Gapyeong-gun': '가평군', 'Yangpyeong-gun': '양평군',
  'Yeoncheon-gun': '연천군',
  // 강원 (32)
  'Chuncheon-si': '춘천시', 'Wonju-si': '원주시', 'Gangneung-si': '강릉시',
  'Donghae-si': '동해시', 'Taebaek-si': '태백시', 'Sokcho-si': '속초시',
  'Samcheok-si': '삼척시', 'Hongcheon-gun': '홍천군', 'Hoengseong-gun': '횡성군',
  'Yeongwol-gun': '영월군', 'Pyeongchang-gun': '평창군', 'Jeongseon-gun': '정선군',
  'Cheorwon-gun': '철원군', 'Hwacheon-gun': '화천군', 'Yanggu-gun': '양구군',
  'Inje-gun': '인제군', 'Yangyang-gun': '양양군',
  // 충북 (33)
  'Cheongju-si': '청주시', 'Chungju-si': '충주시', 'Jecheon-si': '제천시',
  'Boeun-gun': '보은군', 'Okcheon-gun': '옥천군', 'Yeongdong-gun': '영동군',
  'Jeungpyeong-gun': '증평군', 'Jincheon-gun': '진천군', 'Goesan-gun': '괴산군',
  'Eumseong-gun': '음성군', 'Danyang-gun': '단양군',
  // 충남 (34)
  'Cheonan-si': '천안시', 'Gongju-si': '공주시', 'Boryeong-si': '보령시',
  'Asan-si': '아산시', 'Seosan-si': '서산시', 'Nonsan-si': '논산시',
  'Gyeryong-si': '계룡시', 'Dangjin-si': '당진시', 'Geumsan-gun': '금산군',
  'Buyeo-gun': '부여군', 'Seocheon-gun': '서천군', 'Cheongyang-gun': '청양군',
  'Hongseong-gun': '홍성군', 'Yesan-gun': '예산군', 'Taean-gun': '태안군',
  // 전북 (35)
  'Jeonju-si': '전주시', 'Gunsan-si': '군산시', 'Iksan-si': '익산시',
  'Jeongeup-si': '정읍시', 'Namwon-si': '남원시', 'Gimje-si': '김제시',
  'Wanju-gun': '완주군', 'Jinan-gun': '진안군', 'Muju-gun': '무주군',
  'Jangsu-gun': '장수군', 'Imsil-gun': '임실군', 'Sunchang-gun': '순창군',
  'Gochang-gun': '고창군', 'Buan-gun': '부안군',
  // 전남 (36)
  'Mokpo-si': '목포시', 'Yeosu-si': '여수시', 'Suncheon-si': '순천시',
  'Naju-si': '나주시', 'Gwangyang-si': '광양시', 'Damyang-gun': '담양군',
  'Gokseong-gun': '곡성군', 'Gurye-gun': '구례군', 'Goheung-gun': '고흥군',
  'Boseong-gun': '보성군', 'Hwasun-gun': '화순군', 'Jangheung-gun': '장흥군',
  'Gangjin-gun': '강진군', 'Haenam-gun': '해남군', 'Yeongam-gun': '영암군',
  'Muan-gun': '무안군', 'Hampyeong-gun': '함평군', 'Yeonggwang-gun': '영광군',
  'Jangseong-gun': '장성군', 'Wando-gun': '완도군', 'Jindo-gun': '진도군',
  'Sinan-gun': '신안군',
  // 경북 (37)
  'Pohang-si': '포항시', 'Gyeongju-si': '경주시', 'Gimcheon-si': '김천시',
  'Andong-si': '안동시', 'Gumi-si': '구미시', 'Yeongju-si': '영주시',
  'Yeongcheon-si': '영천시', 'Sangju-si': '상주시', 'Mungyeong-si': '문경시',
  'Gyeongsan-si': '경산시', 'Gunwi-gun': '군위군', 'Uiseong-gun': '의성군',
  'Cheongsong-gun': '청송군', 'Yeongyang-gun': '영양군', 'Yeongdeok-gun': '영덕군',
  'Cheongdo-gun': '청도군', 'Goryeong-gun': '고령군', 'Seongju-gun': '성주군',
  'Chilgok-gun': '칠곡군', 'Yecheon-gun': '예천군', 'Bonghwa-gun': '봉화군',
  'Uljin-gun': '울진군', 'Ulleung-gun': '울릉군',
  // 경남 (38)
  'Changwon-si': '창원시', 'Jinju-si': '진주시', 'Tongyeong-si': '통영시',
  'Sacheon-si': '사천시', 'Gimhae-si': '김해시', 'Miryang-si': '밀양시',
  'Geoje-si': '거제시', 'Yangsan-si': '양산시', 'Uiryeong-gun': '의령군',
  'Haman-gun': '함안군', 'Changnyeong-gun': '창녕군', 'Goseong-gun': '고성군',
  'Namhae-gun': '남해군', 'Hadong-gun': '하동군', 'Sancheong-gun': '산청군',
  'Hamyang-gun': '함양군', 'Geochang-gun': '거창군', 'Hapcheon-gun': '합천군',
  // 제주 (39)
  'Jeju-si': '제주시', 'Seogwipo-si': '서귀포시',
};

// 당 색상
const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#1B4FBF',
  '국민의힘': '#C9151E',
  '조국혁신당': '#003F87',
  '개혁신당': '#FF7210',
  '정의당': '#F5C518',
  '진보당': '#E83030',
  '국민의당': '#00C7AE',
  '무소속': '#6B7280',
};
const DEFAULT_FILL = '#E2E8F0';

function getPartyColor(party?: string | null): string {
  if (!party) return DEFAULT_FILL;
  return PARTY_COLORS[party] || '#9CA3AF';
}

interface Politician {
  id: string;
  name: string;
  party: string;
  totalScore: number;
  pollRank?: number | null;
  pollSupport?: string | null;
}

interface RegionData {
  region: string;
  district: string | null;
  first: Politician | null;
  second: Politician | null;
}

interface HoveredInfo {
  nameEng: string;
  code: string;
  data: RegionData | null;
}

interface KoreaDistrictMapProps {
  regionsData: RegionData[];
  viewMode?: 'ai' | 'poll';
  onDistrictClick?: (region: string, district: string) => void;
}

export default function KoreaDistrictMap({
  regionsData,
  viewMode = 'ai',
  onDistrictClick,
}: KoreaDistrictMapProps) {
  const [hovered, setHovered] = useState<HoveredInfo | null>(null);

  // district 이름 → RegionData 매핑 구축
  const districtDataMap = new Map<string, RegionData>();
  for (const r of regionsData) {
    if (r.district) {
      districtDataMap.set(r.district, r);
    }
  }

  // GeoJSON name_eng → RegionData 매칭
  function findDistrictData(nameEng: string): RegionData | null {
    const korName = ENG_TO_KOR_DISTRICT[nameEng];
    if (!korName) return null;
    return districtDataMap.get(korName) || null;
  }

  function handleMouseEnter(nameEng: string, code: string) {
    const data = findDistrictData(nameEng);
    setHovered({ nameEng, code, data });
  }

  function handleClick(nameEng: string, code: string) {
    const provincePrefix = code.slice(0, 2);
    const province = PROVINCE_CODE_MAP[provincePrefix] || '';
    const korDistrict = ENG_TO_KOR_DISTRICT[nameEng] || nameEng;
    if (onDistrictClick && province) {
      onDistrictClick(province, korDistrict);
    }
  }

  const hoveredKorDistrict = hovered ? (ENG_TO_KOR_DISTRICT[hovered.nameEng] || hovered.nameEng) : null;
  const hoveredProvince = hovered ? (PROVINCE_CODE_MAP[hovered.code.slice(0, 2)] || '') : null;

  return (
    <div className="relative w-full select-none">
      {/* 호버 툴팁: 지도 우측 상단 고정 */}
      {hovered && (
        <div className="absolute top-2 right-2 z-30 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-3 min-w-[160px] max-w-[200px] border border-gray-200 dark:border-gray-600 pointer-events-none">
          <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1 pb-1 border-b border-gray-100 dark:border-gray-700">
            <span className="text-[9px] text-gray-400 block">{hoveredProvince}</span>
            {hoveredKorDistrict}
          </div>
          {hovered.data?.first ? (
            <>
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getPartyColor(hovered.data.first.party) }}
                />
                <div className="min-w-0">
                  <div className="text-[9px] text-gray-400">1위</div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                    {hovered.data.first.name}
                  </div>
                  <div
                    className="text-[9px] truncate"
                    style={{ color: getPartyColor(hovered.data.first.party) }}
                  >
                    {hovered.data.first.party}
                    {viewMode === 'ai' && hovered.data.first.totalScore > 0
                      ? ` · ${hovered.data.first.totalScore}점`
                      : viewMode === 'poll' && hovered.data.first.pollSupport
                      ? ` · ${hovered.data.first.pollSupport}`
                      : viewMode === 'poll' && hovered.data.first.pollRank
                      ? ` · ${hovered.data.first.pollRank}위`
                      : ''}
                  </div>
                </div>
              </div>
              {hovered.data.second && (
                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700 opacity-80">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getPartyColor(hovered.data.second.party) }}
                  />
                  <div className="min-w-0">
                    <div className="text-[9px] text-gray-400">2위</div>
                    <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {hovered.data.second.name}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-[10px] text-gray-400 mt-1">등록된 정치인 없음</div>
          )}
          <div className="mt-1.5 text-[9px] text-gray-400">클릭 → 지역 랭킹 이동</div>
        </div>
      )}

      {/* 지도 */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [128, 36.5],
          scale: 5200,
        }}
        width={400}
        height={500}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const props = geo.properties as { code: string; name_eng: string };
              const { code, name_eng } = props;
              const data = findDistrictData(name_eng);
              const fillColor = data?.first ? getPartyColor(data.first.party) : DEFAULT_FILL;
              const isHovered = hovered?.nameEng === name_eng;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  fillOpacity={isHovered ? 1 : data?.first ? 0.82 : 0.55}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 0.8 : 0.3}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={() => handleMouseEnter(name_eng, code)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleClick(name_eng, code)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
