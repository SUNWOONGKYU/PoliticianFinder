// Task: P4BA2 - 정치인 데이터 시딩
// 초기 정치인 데이터를 Supabase 데이터베이스에 삽입하는 스크립트

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import type { PoliticianCrawlData } from '../../src/lib/crawlers/types';

// Supabase 클라이언트 설정
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * 정치인 데이터 타입 (DB 스키마)
 */
interface PoliticianInsert {
  name: string;
  name_en?: string;
  party: string;
  position?: string;
  region?: string;
  district?: string;
  profile_image_url?: string;
  birth_date?: string;
  education?: string[];
  website_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  phone?: string;
  email?: string;
  office_address?: string;
}

/**
 * 경력 데이터 타입
 */
interface CareerInsert {
  politician_id: string;
  title: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  order_index: number;
}

/**
 * 공약 데이터 타입
 */
interface PledgeInsert {
  politician_id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'broken' | 'postponed';
  progress_percentage?: number;
  target_date?: string;
}

/**
 * 시딩 통계
 */
interface SeedStats {
  politiciansInserted: number;
  politiciansUpdated: number;
  politiciansFailed: number;
  careersInserted: number;
  pledgesInserted: number;
  errors: string[];
}

/**
 * 크롤링 데이터를 DB 형식으로 변환
 */
function transformCrawlDataToPolitician(
  crawlData: PoliticianCrawlData
): PoliticianInsert {
  return {
    name: crawlData.name,
    party: crawlData.party,
    district: crawlData.district,
    phone: crawlData.contact?.phone,
    email: crawlData.contact?.email,
    office_address: crawlData.contact?.office,
  };
}

/**
 * 크롤링 경력 데이터를 DB 형식으로 변환
 */
function transformCareers(
  politicianId: string,
  careers: PoliticianCrawlData['career']
): CareerInsert[] {
  return careers.map((career, index) => ({
    politician_id: politicianId,
    title: career.description,
    description: career.description,
    is_current: career.period.includes('현재') || !career.period.includes('-'),
    order_index: index,
  }));
}

/**
 * 샘플 정치인 데이터 생성
 */
function generateSamplePoliticians(): PoliticianInsert[] {
  return [
    {
      name: '홍길동',
      name_en: 'Hong Gil-dong',
      party: '더불어민주당',
      position: '국회의원',
      region: '서울',
      district: '강남구 갑',
      email: 'hong@assembly.go.kr',
      phone: '02-788-1111',
      office_address: '서울특별시 영등포구 의사당대로 1',
      education: ['서울대학교 법학과 졸업', '하버드대학교 대학원 석사'],
      website_url: 'https://www.assembly.go.kr',
    },
    {
      name: '김철수',
      name_en: 'Kim Chul-soo',
      party: '국민의힘',
      position: '국회의원',
      region: '경기',
      district: '성남시 분당구',
      email: 'kim@assembly.go.kr',
      phone: '02-788-2222',
      office_address: '서울특별시 영등포구 의사당대로 1',
      education: ['연세대학교 경제학과 졸업', '서울대학교 대학원 박사'],
      website_url: 'https://www.assembly.go.kr',
    },
    {
      name: '이영희',
      name_en: 'Lee Young-hee',
      party: '정의당',
      position: '국회의원',
      region: '부산',
      district: '해운대구',
      email: 'lee@assembly.go.kr',
      phone: '02-788-3333',
      office_address: '서울특별시 영등포구 의사당대로 1',
      education: ['이화여자대학교 정치외교학과 졸업'],
      website_url: 'https://www.assembly.go.kr',
    },
  ];
}

/**
 * 샘플 경력 데이터 생성
 */
function generateSampleCareers(politicianId: string): CareerInsert[] {
  return [
    {
      politician_id: politicianId,
      title: '제21대 국회의원',
      organization: '대한민국 국회',
      start_date: '2020-05-30',
      is_current: true,
      description: '제21대 국회의원 (현역)',
      order_index: 0,
    },
    {
      politician_id: politicianId,
      title: '기획재정위원회 위원',
      organization: '대한민국 국회',
      start_date: '2020-06-01',
      is_current: true,
      description: '국회 기획재정위원회 위원',
      order_index: 1,
    },
    {
      politician_id: politicianId,
      title: '서울시의회 의원',
      organization: '서울특별시의회',
      start_date: '2014-07-01',
      end_date: '2018-06-30',
      is_current: false,
      description: '서울시의회 의원 (7대)',
      order_index: 2,
    },
  ];
}

/**
 * 샘플 공약 데이터 생성
 */
function generateSamplePledges(politicianId: string): PledgeInsert[] {
  return [
    {
      politician_id: politicianId,
      title: '청년 일자리 1만개 창출',
      description: '지역 청년을 위한 양질의 일자리 1만개 창출',
      category: '일자리',
      status: 'in_progress',
      progress_percentage: 45,
      target_date: '2024-05-29',
    },
    {
      politician_id: politicianId,
      title: '지역 교통 인프라 확충',
      description: '지하철 노선 연장 및 버스 노선 개편',
      category: '교통',
      status: 'in_progress',
      progress_percentage: 30,
      target_date: '2024-12-31',
    },
    {
      politician_id: politicianId,
      title: '보육시설 확대',
      description: '공공 어린이집 20개소 신설',
      category: '복지',
      status: 'completed',
      progress_percentage: 100,
      target_date: '2023-12-31',
    },
  ];
}

/**
 * JSON 파일에서 크롤링 데이터 로드
 */
async function loadCrawlData(filePath: string): Promise<PoliticianCrawlData[]> {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      console.log(`⚠️  Crawl data file not found: ${absolutePath}`);
      return [];
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // 데이터가 배열인지 확인
    if (!Array.isArray(data)) {
      console.error('❌ Invalid crawl data format: expected array');
      return [];
    }

    console.log(`✅ Loaded ${data.length} politicians from crawl data`);
    return data;
  } catch (error) {
    console.error(`❌ Error loading crawl data:`, error);
    return [];
  }
}

/**
 * 정치인 UPSERT (중복 체크 및 삽입/업데이트)
 */
async function upsertPolitician(
  politician: PoliticianInsert
): Promise<{ id: string; isNew: boolean } | null> {
  try {
    // name과 party로 중복 체크
    const { data: existing, error: selectError } = await supabase
      .from('politicians')
      .select('id')
      .eq('name', politician.name)
      .eq('party', politician.party)
      .maybeSingle();

    if (selectError) {
      console.error(`❌ Error checking politician:`, selectError);
      return null;
    }

    if (existing) {
      // 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('politicians')
        .update({
          ...politician,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (updateError) {
        console.error(`❌ Error updating politician:`, updateError);
        return null;
      }

      return { id: updated.id, isNew: false };
    } else {
      // 삽입
      const { data: inserted, error: insertError } = await supabase
        .from('politicians')
        .insert(politician)
        .select('id')
        .single();

      if (insertError) {
        console.error(`❌ Error inserting politician:`, insertError);
        return null;
      }

      return { id: inserted.id, isNew: true };
    }
  } catch (error) {
    console.error(`❌ Error upserting politician:`, error);
    return null;
  }
}

/**
 * 경력 삽입 (기존 경력 삭제 후 재삽입)
 */
async function insertCareers(
  politicianId: string,
  careers: CareerInsert[]
): Promise<number> {
  try {
    // 기존 경력 삭제
    await supabase.from('careers').delete().eq('politician_id', politicianId);

    if (careers.length === 0) {
      return 0;
    }

    // 새 경력 삽입
    const { data, error } = await supabase.from('careers').insert(careers);

    if (error) {
      console.error(`❌ Error inserting careers:`, error);
      return 0;
    }

    return careers.length;
  } catch (error) {
    console.error(`❌ Error inserting careers:`, error);
    return 0;
  }
}

/**
 * 공약 삽입 (기존 공약 삭제 후 재삽입)
 */
async function insertPledges(
  politicianId: string,
  pledges: PledgeInsert[]
): Promise<number> {
  try {
    // 기존 공약 삭제
    await supabase.from('pledges').delete().eq('politician_id', politicianId);

    if (pledges.length === 0) {
      return 0;
    }

    // 새 공약 삽입
    const { data, error } = await supabase.from('pledges').insert(pledges);

    if (error) {
      console.error(`❌ Error inserting pledges:`, error);
      return 0;
    }

    return pledges.length;
  } catch (error) {
    console.error(`❌ Error inserting pledges:`, error);
    return 0;
  }
}

/**
 * 메인 시딩 함수
 */
async function seedPoliticians() {
  console.log('🌱 Starting politician data seeding...\n');

  const stats: SeedStats = {
    politiciansInserted: 0,
    politiciansUpdated: 0,
    politiciansFailed: 0,
    careersInserted: 0,
    pledgesInserted: 0,
    errors: [],
  };

  try {
    // 1. 크롤링 데이터 로드 시도
    const crawlDataPath = process.argv[2] || './data/crawled-politicians.json';
    let crawlData = await loadCrawlData(crawlDataPath);

    // 2. 크롤링 데이터가 없으면 샘플 데이터 사용
    let politicians: PoliticianInsert[] = [];

    if (crawlData.length > 0) {
      console.log(`📊 Using crawl data (${crawlData.length} politicians)\n`);
      politicians = crawlData.map(transformCrawlDataToPolitician);
    } else {
      console.log(`📊 Using sample data\n`);
      politicians = generateSamplePoliticians();
    }

    // 3. 각 정치인 처리
    for (let i = 0; i < politicians.length; i++) {
      const politician = politicians[i];
      console.log(
        `[${i + 1}/${politicians.length}] Processing: ${politician.name} (${politician.party})`
      );

      // 정치인 UPSERT
      const result = await upsertPolitician(politician);

      if (!result) {
        stats.politiciansFailed++;
        stats.errors.push(`Failed to upsert: ${politician.name}`);
        continue;
      }

      if (result.isNew) {
        stats.politiciansInserted++;
        console.log(`  ✅ Inserted politician (ID: ${result.id})`);
      } else {
        stats.politiciansUpdated++;
        console.log(`  ♻️  Updated politician (ID: ${result.id})`);
      }

      // 경력 삽입
      let careers: CareerInsert[] = [];

      if (crawlData.length > 0 && crawlData[i]?.career) {
        careers = transformCareers(result.id, crawlData[i].career);
      } else {
        careers = generateSampleCareers(result.id);
      }

      const careersInserted = await insertCareers(result.id, careers);
      stats.careersInserted += careersInserted;
      console.log(`  ✅ Inserted ${careersInserted} careers`);

      // 공약 삽입 (샘플 데이터만)
      if (crawlData.length === 0) {
        const pledges = generateSamplePledges(result.id);
        const pledgesInserted = await insertPledges(result.id, pledges);
        stats.pledgesInserted += pledgesInserted;
        console.log(`  ✅ Inserted ${pledgesInserted} pledges`);
      }

      console.log('');
    }

    // 4. 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Seeding completed!\n');
    console.log('📊 Statistics:');
    console.log(`  - Politicians inserted: ${stats.politiciansInserted}`);
    console.log(`  - Politicians updated: ${stats.politiciansUpdated}`);
    console.log(`  - Politicians failed: ${stats.politiciansFailed}`);
    console.log(`  - Careers inserted: ${stats.careersInserted}`);
    console.log(`  - Pledges inserted: ${stats.pledgesInserted}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      stats.errors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// 스크립트 실행
seedPoliticians();
