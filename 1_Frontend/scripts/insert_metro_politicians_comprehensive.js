// 2026 지방선거 광역단체장 후보 일괄 등록
// 목표: 17개 광역단체 × 최소 5명 = 85명+
//
// 실행: node scripts/insert_metro_politicians_comprehensive.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU'
);

// ── 기존 정치인: title/region/position만 UPDATE (다른 데이터 보존) ──────────
const existingUpdates = [
  // 서울특별시
  { id: '62e7b453', region: '서울특별시' }, // 오세훈
  { id: '17270f25', region: '서울특별시' }, // 정원오
  { id: '88aaecf2', region: '서울특별시' }, // 나경원
  { id: '8c5dcc89', region: '서울특별시' }, // 박주민
  { id: 'eeefba98', region: '서울특별시' }, // 안철수
  // 경기도
  { id: '0756ec15', region: '경기도' },     // 김동연
  { id: '650822f1', region: '경기도' },     // 유승민
  // 부산광역시
  { id: '03965603', region: '부산광역시' }, // 전재수
  { id: '950441ae', region: '부산광역시' }, // 박형준
  // 대구광역시
  { id: '8bb1d179', region: '대구광역시' }, // 김부겸
  { id: '39154f36', region: '대구광역시' }, // 추경호
  { id: 'e7c3b982', region: '대구광역시' }, // 권영진
  // 강원특별자치도
  { id: 'cb096e5f', region: '강원특별자치도' }, // 우상호
  { id: 'aef87dd2', region: '강원특별자치도' }, // 김진태
  // 경상남도
  { id: '3fc211f1', region: '경상남도' },   // 김경수
  { id: '8469816a', region: '경상남도' },   // 박완수
  // 전라남도
  { id: '84e44375', region: '전라남도' },   // 김영록
  // 충청남도
  { id: '201eb7fc', region: '충청남도' },   // 강훈식
  { id: '65a89ed8', region: '충청남도' },   // 김태흠
];

// ── 신규 정치인 INSERT ─────────────────────────────────────────────────────
// ID 형식: 8자리 hexadecimal (UUID 앞 8자리 방식)
const newPoliticians = [
  // ── 서울특별시 (기존 5명 + 신규 1명 = 6명) ────────────────────────────────
  { id: 'cf1a0001', name: '조정훈', party: '더불어민주당', region: '서울특별시' },

  // ── 경기도 (기존 2명 + 신규 3명 = 5명) ────────────────────────────────────
  { id: 'cf1a0002', name: '이재정', party: '더불어민주당', region: '경기도' },
  { id: 'cf1a0003', name: '고민정', party: '더불어민주당', region: '경기도' },
  { id: 'cf1a0004', name: '원희룡', party: '국민의힘', region: '경기도' },

  // ── 인천광역시 (신규 5명) ──────────────────────────────────────────────────
  { id: 'cf1a0005', name: '유정복', party: '국민의힘', region: '인천광역시' },
  { id: 'cf1a0006', name: '박찬대', party: '더불어민주당', region: '인천광역시' },
  { id: 'cf1a0007', name: '허종식', party: '더불어민주당', region: '인천광역시' },
  { id: 'cf1a0008', name: '배준영', party: '국민의힘', region: '인천광역시' },
  { id: 'cf1a0009', name: '유동수', party: '더불어민주당', region: '인천광역시' },

  // ── 부산광역시 (기존 2명 + 신규 3명 = 5명) ────────────────────────────────
  { id: 'cf1a000a', name: '이헌승', party: '국민의힘', region: '부산광역시' },
  { id: 'cf1a000b', name: '김영춘', party: '더불어민주당', region: '부산광역시' },
  { id: 'cf1a000c', name: '조경태', party: '국민의힘', region: '부산광역시' },

  // ── 대구광역시 (기존 3명 + 신규 2명 = 5명) ────────────────────────────────
  { id: 'cf1a000d', name: '홍준표', party: '국민의힘', region: '대구광역시' },
  { id: 'cf1a000e', name: '이상열', party: '더불어민주당', region: '대구광역시' },

  // ── 광주광역시 (신규 5명) ──────────────────────────────────────────────────
  { id: 'cf1a000f', name: '강기정', party: '더불어민주당', region: '광주광역시' },
  { id: 'cf1a0010', name: '민형배', party: '더불어민주당', region: '광주광역시' },
  { id: 'cf1a0011', name: '이용섭', party: '더불어민주당', region: '광주광역시' },
  { id: 'cf1a0012', name: '조오섭', party: '더불어민주당', region: '광주광역시' },
  { id: 'cf1a0013', name: '정준호', party: '더불어민주당', region: '광주광역시' },

  // ── 대전광역시 (신규 5명) ──────────────────────────────────────────────────
  { id: 'cf1a0014', name: '이장우', party: '국민의힘', region: '대전광역시' },
  { id: 'cf1a0015', name: '박수현', party: '더불어민주당', region: '대전광역시' },
  { id: 'cf1a0016', name: '이은권', party: '국민의힘', region: '대전광역시' },
  { id: 'cf1a0017', name: '황운하', party: '더불어민주당', region: '대전광역시' },
  { id: 'cf1a0018', name: '조승래', party: '더불어민주당', region: '대전광역시' },

  // ── 울산광역시 (신규 5명) ──────────────────────────────────────────────────
  { id: 'cf1a0019', name: '김두겸', party: '국민의힘', region: '울산광역시' },
  { id: 'cf1a001a', name: '김상욱', party: '더불어민주당', region: '울산광역시' },
  { id: 'cf1a001b', name: '박성민', party: '국민의힘', region: '울산광역시' },
  { id: 'cf1a001c', name: '이상헌', party: '더불어민주당', region: '울산광역시' },
  { id: 'cf1a001d', name: '서범수', party: '국민의힘', region: '울산광역시' },

  // ── 세종특별자치시 (신규 5명) ─────────────────────────────────────────────
  { id: 'cf1a001e', name: '최민호', party: '국민의힘', region: '세종특별자치시' },
  { id: 'cf1a001f', name: '이춘희', party: '더불어민주당', region: '세종특별자치시' },
  { id: 'cf1a0020', name: '조상호', party: '더불어민주당', region: '세종특별자치시' },
  { id: 'cf1a0021', name: '강준현', party: '더불어민주당', region: '세종특별자치시' },
  { id: 'cf1a0022', name: '이영선', party: '국민의힘', region: '세종특별자치시' },

  // ── 강원특별자치도 (기존 2명 + 신규 3명 = 5명) ────────────────────────────
  { id: 'cf1a0023', name: '허영', party: '더불어민주당', region: '강원특별자치도' },
  { id: 'cf1a0024', name: '이광재', party: '더불어민주당', region: '강원특별자치도' },
  { id: 'cf1a0025', name: '이성원', party: '국민의힘', region: '강원특별자치도' },

  // ── 충청북도 (신규 5명) ────────────────────────────────────────────────────
  { id: 'cf1a0026', name: '김영환', party: '국민의힘', region: '충청북도' },
  { id: 'cf1a0027', name: '노영민', party: '더불어민주당', region: '충청북도' },
  { id: 'cf1a0028', name: '신용한', party: '국민의힘', region: '충청북도' },
  { id: 'cf1a0029', name: '송기섭', party: '더불어민주당', region: '충청북도' },
  { id: 'cf1a002a', name: '도종환', party: '더불어민주당', region: '충청북도' },

  // ── 충청남도 (기존 2명 + 신규 3명 = 5명) ─────────────────────────────────
  { id: 'cf1a002b', name: '양승조', party: '더불어민주당', region: '충청남도' },
  { id: 'cf1a002c', name: '김동완', party: '국민의힘', region: '충청남도' },
  { id: 'cf1a002d', name: '이명수', party: '국민의힘', region: '충청남도' },

  // ── 전라북도 (신규 5명) ────────────────────────────────────────────────────
  { id: 'cf1a002e', name: '김관영', party: '더불어민주당', region: '전라북도' },
  { id: 'cf1a002f', name: '이원택', party: '더불어민주당', region: '전라북도' },
  { id: 'cf1a0030', name: '한병도', party: '더불어민주당', region: '전라북도' },
  { id: 'cf1a0031', name: '박희승', party: '더불어민주당', region: '전라북도' },
  { id: 'cf1a0032', name: '신영대', party: '더불어민주당', region: '전라북도' },

  // ── 전라남도 (기존 1명 + 신규 4명 = 5명) ─────────────────────────────────
  { id: 'cf1a0033', name: '이낙연', party: '더불어민주당', region: '전라남도' },
  { id: 'cf1a0034', name: '박홍률', party: '더불어민주당', region: '전라남도' },
  { id: 'cf1a0035', name: '서동용', party: '더불어민주당', region: '전라남도' },
  { id: 'cf1a0036', name: '손금주', party: '더불어민주당', region: '전라남도' },

  // ── 경상북도 (신규 5명) ────────────────────────────────────────────────────
  { id: 'cf1a0037', name: '이철우', party: '국민의힘', region: '경상북도' },
  { id: 'cf1a0038', name: '김재원', party: '국민의힘', region: '경상북도' },
  { id: 'cf1a0039', name: '최경환', party: '국민의힘', region: '경상북도' },
  { id: 'cf1a003a', name: '윤두현', party: '국민의힘', region: '경상북도' },
  { id: 'cf1a003b', name: '강석호', party: '국민의힘', region: '경상북도' },

  // ── 경상남도 (기존 2명 + 신규 3명 = 5명) ─────────────────────────────────
  { id: 'cf1a003c', name: '조해진', party: '국민의힘', region: '경상남도' },
  { id: 'cf1a003d', name: '민홍철', party: '더불어민주당', region: '경상남도' },
  { id: 'cf1a003e', name: '최형두', party: '국민의힘', region: '경상남도' },

  // ── 제주특별자치도 (신규 5명) ─────────────────────────────────────────────
  { id: 'cf1a003f', name: '오영훈', party: '더불어민주당', region: '제주특별자치도' },
  { id: 'cf1a0040', name: '문대림', party: '더불어민주당', region: '제주특별자치도' },
  { id: 'cf1a0041', name: '고병수', party: '더불어민주당', region: '제주특별자치도' },
  { id: 'cf1a0042', name: '부태완', party: '국민의힘', region: '제주특별자치도' },
  { id: 'cf1a0043', name: '부상일', party: '국민의힘', region: '제주특별자치도' },
];

async function main() {
  console.log('=== 2026 광역단체장 후보 DB 등록 시작 ===\n');

  // 1. 기존 정치인 UPDATE (title/region/position만)
  console.log(`[1단계] 기존 ${existingUpdates.length}명 title/region 업데이트...`);
  let updateSuccess = 0;
  let updateFail = 0;

  for (const { id, region } of existingUpdates) {
    const { error } = await supabase
      .from('politicians')
      .update({ title: '광역단체장', position: '광역단체장 후보', region })
      .eq('id', id);

    if (error) {
      console.error(`  ✗ UPDATE 실패 (${id}):`, error.message);
      updateFail++;
    } else {
      updateSuccess++;
    }
  }
  console.log(`  → 성공 ${updateSuccess}명, 실패 ${updateFail}명\n`);

  // 2. 신규 정치인 INSERT
  console.log(`[2단계] 신규 ${newPoliticians.length}명 INSERT...`);
  let insertSuccess = 0;
  let insertSkip = 0;
  let insertFail = 0;

  for (const p of newPoliticians) {
    const row = {
      id: p.id,
      name: p.name,
      party: p.party,
      region: p.region,
      title: '광역단체장',
      position: '광역단체장 후보',
    };

    const { error } = await supabase
      .from('politicians')
      .insert(row);

    if (error) {
      if (error.code === '23505') {
        // 중복 키 - 이미 존재 → UPDATE로 전환
        const { error: updateError } = await supabase
          .from('politicians')
          .update({ title: '광역단체장', position: '광역단체장 후보', region: p.region })
          .eq('id', p.id);
        if (updateError) {
          console.error(`  ✗ UPSERT 실패 (${p.name}):`, updateError.message);
          insertFail++;
        } else {
          console.log(`  ↺ 업데이트 (기존 존재): ${p.name}`);
          insertSkip++;
        }
      } else {
        console.error(`  ✗ INSERT 실패 (${p.name}):`, error.message);
        insertFail++;
      }
    } else {
      insertSuccess++;
    }
  }
  console.log(`  → 신규 등록 ${insertSuccess}명, 기존 업데이트 ${insertSkip}명, 실패 ${insertFail}명\n`);

  // 3. 최종 확인
  const { data: result, error: countError } = await supabase
    .from('politicians')
    .select('region, name')
    .eq('title', '광역단체장');

  if (countError) {
    console.error('최종 확인 실패:', countError.message);
    return;
  }

  // 지역별 집계
  const regionMap = {};
  for (const p of result || []) {
    regionMap[p.region] = (regionMap[p.region] || 0) + 1;
  }

  console.log('=== 최종 지역별 등록 현황 ===');
  const regions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
  for (const [region, count] of regions) {
    const status = count >= 5 ? '✅' : count >= 3 ? '⚠️' : '❌';
    console.log(`  ${status} ${region}: ${count}명`);
  }
  console.log(`\n총 ${result.length}명 등록 완료`);

  const under5 = regions.filter(([, c]) => c < 5);
  if (under5.length > 0) {
    console.log(`\n⚠️ 5명 미만 지역: ${under5.map(([r, c]) => `${r}(${c}명)`).join(', ')}`);
  } else {
    console.log('\n✅ 모든 지역 5명 이상 달성!');
  }
}

main().catch(console.error);
