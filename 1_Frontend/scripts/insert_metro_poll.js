const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU'
);

const rows = [
  // ── 서울특별시 ──────────────────────────────────────────────────────
  { politician_id:'17270f25', politician_name:'정원오', party:'더불어민주당', region:'서울특별시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:1, poll_support_pct:55.8, poll_start_date:'2026-02-20', poll_end_date:'2026-02-22', sample_size:1021, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://imnews.imbc.com/news/2026/politics/article/6801176_36911.html' },
  { politician_id:'62e7b453', politician_name:'오세훈', party:'국민의힘', region:'서울특별시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:2, poll_support_pct:32.4, poll_start_date:'2026-02-20', poll_end_date:'2026-02-22', sample_size:1021, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://imnews.imbc.com/news/2026/politics/article/6801176_36911.html' },
  { politician_id:'8c5dcc89', politician_name:'박주민', party:'더불어민주당', region:'서울특별시', poll_agency:'리얼미터', poll_scope:'national', poll_rank:1, poll_support_pct:48.2, poll_start_date:'2026-02-10', poll_end_date:'2026-02-12', sample_size:1003, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  { politician_id:'62e7b453', politician_name:'오세훈', party:'국민의힘', region:'서울특별시', poll_agency:'리얼미터', poll_scope:'national', poll_rank:2, poll_support_pct:40.5, poll_start_date:'2026-02-10', poll_end_date:'2026-02-12', sample_size:1003, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  { politician_id:'17270f25', politician_name:'정원오', party:'더불어민주당', region:'서울특별시', poll_agency:'한국갤럽', poll_scope:'national', poll_rank:1, poll_support_pct:37.8, poll_start_date:'2026-02-03', poll_end_date:'2026-02-05', sample_size:1000, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  { politician_id:'62e7b453', politician_name:'오세훈', party:'국민의힘', region:'서울특별시', poll_agency:'한국갤럽', poll_scope:'national', poll_rank:2, poll_support_pct:30.2, poll_start_date:'2026-02-03', poll_end_date:'2026-02-05', sample_size:1000, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  { politician_id:'1005', politician_name:'나경원', party:'국민의힘', region:'서울특별시', poll_agency:'한국갤럽', poll_scope:'national', poll_rank:3, poll_support_pct:14.1, poll_start_date:'2026-02-03', poll_end_date:'2026-02-05', sample_size:1000, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  // ── 경기도 ──────────────────────────────────────────────────────────
  { politician_id:'0756ec15', politician_name:'김동연', party:'더불어민주당', region:'경기도', poll_agency:'한국갤럽', poll_scope:'national', poll_rank:1, poll_support_pct:31.2, poll_start_date:'2026-02-10', poll_end_date:'2026-02-12', sample_size:1005, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://v.daum.net/v/20251020060005078' },
  { politician_id:'650822f1', politician_name:'유승민', party:'국민의힘', region:'경기도', poll_agency:'한국갤럽', poll_scope:'national', poll_rank:2, poll_support_pct:26.5, poll_start_date:'2026-02-10', poll_end_date:'2026-02-12', sample_size:1005, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://v.daum.net/v/20251020060005078' },
  { politician_id:'0756ec15', politician_name:'김동연', party:'더불어민주당', region:'경기도', poll_agency:'리얼미터', poll_scope:'national', poll_rank:1, poll_support_pct:29.9, poll_start_date:'2026-02-03', poll_end_date:'2026-02-05', sample_size:1002, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  // ── 부산광역시 ──────────────────────────────────────────────────────
  { politician_id:'03965603', politician_name:'전재수', party:'더불어민주당', region:'부산광역시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:1, poll_support_pct:46.7, poll_start_date:'2026-02-05', poll_end_date:'2026-02-07', sample_size:1006, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://www.polinews.co.kr/news/articleView.html?idxno=723085' },
  { politician_id:'950441ae', politician_name:'박형준', party:'국민의힘', region:'부산광역시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:2, poll_support_pct:38.4, poll_start_date:'2026-02-05', poll_end_date:'2026-02-07', sample_size:1006, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://www.polinews.co.kr/news/articleView.html?idxno=723085' },
  { politician_id:'03965603', politician_name:'전재수', party:'더불어민주당', region:'부산광역시', poll_agency:'리얼미터', poll_scope:'national', poll_rank:1, poll_support_pct:40.0, poll_start_date:'2026-01-20', poll_end_date:'2026-01-22', sample_size:1000, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  { politician_id:'950441ae', politician_name:'박형준', party:'국민의힘', region:'부산광역시', poll_agency:'리얼미터', poll_scope:'national', poll_rank:2, poll_support_pct:30.0, poll_start_date:'2026-01-20', poll_end_date:'2026-01-22', sample_size:1000, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  // ── 인천광역시 ──────────────────────────────────────────────────────
  { politician_id:null, politician_name:'박찬대', party:'더불어민주당', region:'인천광역시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:1, poll_support_pct:51.2, poll_start_date:'2026-02-01', poll_end_date:'2026-02-03', sample_size:1005, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://www.kyeongin.com/article/1759404' },
  { politician_id:null, politician_name:'유정복', party:'국민의힘', region:'인천광역시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:2, poll_support_pct:37.1, poll_start_date:'2026-02-01', poll_end_date:'2026-02-03', sample_size:1005, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://www.kyeongin.com/article/1759404' },
  // ── 강원특별자치도 ──────────────────────────────────────────────────
  { politician_id:'cb096e5f', politician_name:'우상호', party:'더불어민주당', region:'강원특별자치도', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:1, poll_support_pct:45.4, poll_start_date:'2026-01-15', poll_end_date:'2026-01-17', sample_size:800, margin_of_error:3.5, poll_method:'전화면접', source_url:null },
  { politician_id:'aef87dd2', politician_name:'김진태', party:'국민의힘', region:'강원특별자치도', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:2, poll_support_pct:40.9, poll_start_date:'2026-01-15', poll_end_date:'2026-01-17', sample_size:800, margin_of_error:3.5, poll_method:'전화면접', source_url:null },
  { politician_id:'cb096e5f', politician_name:'우상호', party:'더불어민주당', region:'강원특별자치도', poll_agency:'강원MBC', poll_scope:'regional', poll_rank:1, poll_support_pct:46.1, poll_start_date:'2026-02-10', poll_end_date:'2026-02-12', sample_size:805, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://chmbc.co.kr/article/QqCCBJWhkWzMZ' },
  { politician_id:'aef87dd2', politician_name:'김진태', party:'국민의힘', region:'강원특별자치도', poll_agency:'강원MBC', poll_scope:'regional', poll_rank:2, poll_support_pct:31.4, poll_start_date:'2026-02-10', poll_end_date:'2026-02-12', sample_size:805, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://chmbc.co.kr/article/QqCCBJWhkWzMZ' },
  // ── 대구광역시 ──────────────────────────────────────────────────────
  { politician_id:'8bb1d179', politician_name:'김부겸', party:'더불어민주당', region:'대구광역시', poll_agency:'대구일보', poll_scope:'regional', poll_rank:1, poll_support_pct:28.7, poll_start_date:'2026-02-05', poll_end_date:'2026-02-07', sample_size:803, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://v.daum.net/v/20260211194009558' },
  { politician_id:'39154f36', politician_name:'추경호', party:'국민의힘', region:'대구광역시', poll_agency:'대구일보', poll_scope:'regional', poll_rank:2, poll_support_pct:19.4, poll_start_date:'2026-02-05', poll_end_date:'2026-02-07', sample_size:803, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://v.daum.net/v/20260211194009558' },
  { politician_id:'e7c3b982', politician_name:'권영진', party:'국민의힘', region:'대구광역시', poll_agency:'대구일보', poll_scope:'regional', poll_rank:3, poll_support_pct:14.1, poll_start_date:'2026-02-05', poll_end_date:'2026-02-07', sample_size:803, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://v.daum.net/v/20260211194009558' },
  // ── 경상남도 ────────────────────────────────────────────────────────
  { politician_id:'3fc211f1', politician_name:'김경수', party:'더불어민주당', region:'경상남도', poll_agency:'리얼미터', poll_scope:'national', poll_rank:1, poll_support_pct:47.7, poll_start_date:'2026-01-20', poll_end_date:'2026-01-22', sample_size:808, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://v.daum.net/v/20251120100001054' },
  { politician_id:'8469816a', politician_name:'박완수', party:'국민의힘', region:'경상남도', poll_agency:'리얼미터', poll_scope:'national', poll_rank:2, poll_support_pct:45.0, poll_start_date:'2026-01-20', poll_end_date:'2026-01-22', sample_size:808, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://v.daum.net/v/20251120100001054' },
  // ── 울산광역시 ──────────────────────────────────────────────────────
  { politician_id:null, politician_name:'김상욱', party:'더불어민주당', region:'울산광역시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:1, poll_support_pct:47.0, poll_start_date:'2026-02-03', poll_end_date:'2026-02-05', sample_size:805, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.news1.kr/local/ulsan/6056718' },
  { politician_id:null, politician_name:'김두겸', party:'국민의힘', region:'울산광역시', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:2, poll_support_pct:34.0, poll_start_date:'2026-02-03', poll_end_date:'2026-02-05', sample_size:805, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.news1.kr/local/ulsan/6056718' },
  // ── 광주광역시 ──────────────────────────────────────────────────────
  { politician_id:null, politician_name:'민형배', party:'더불어민주당', region:'광주광역시', poll_agency:'광주MBC', poll_scope:'regional', poll_rank:1, poll_support_pct:33.0, poll_start_date:'2026-02-01', poll_end_date:'2026-02-03', sample_size:805, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://kjmbc.co.kr/NewsArticle/1498791' },
  { politician_id:null, politician_name:'강기정', party:'더불어민주당', region:'광주광역시', poll_agency:'광주MBC', poll_scope:'regional', poll_rank:2, poll_support_pct:14.0, poll_start_date:'2026-02-01', poll_end_date:'2026-02-03', sample_size:805, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://kjmbc.co.kr/NewsArticle/1498791' },
  // ── 전라남도 ────────────────────────────────────────────────────────
  { politician_id:'84e44375', politician_name:'김영록', party:'더불어민주당', region:'전라남도', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:1, poll_support_pct:25.6, poll_start_date:'2025-11-01', poll_end_date:'2025-11-03', sample_size:800, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.pressian.com/pages/articles/2025110914395446169' },
  // ── 충청남도 ────────────────────────────────────────────────────────
  { politician_id:'201eb7fc', politician_name:'강훈식', party:'더불어민주당', region:'충청남도', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:1, poll_support_pct:26.7, poll_start_date:'2026-01-10', poll_end_date:'2026-01-12', sample_size:803, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2257426' },
  { politician_id:'65a89ed8', politician_name:'김태흠', party:'국민의힘', region:'충청남도', poll_agency:'여론조사꽃', poll_scope:'national', poll_rank:2, poll_support_pct:15.6, poll_start_date:'2026-01-10', poll_end_date:'2026-01-12', sample_size:803, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2257426' },
  // ── 제주특별자치도 ──────────────────────────────────────────────────
  { politician_id:null, politician_name:'문대림', party:'더불어민주당', region:'제주특별자치도', poll_agency:'리얼미터', poll_scope:'national', poll_rank:1, poll_support_pct:null, poll_start_date:'2026-01-20', poll_end_date:'2026-01-22', sample_size:1014, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  { politician_id:null, politician_name:'오영훈', party:'더불어민주당', region:'제주특별자치도', poll_agency:'리얼미터', poll_scope:'national', poll_rank:2, poll_support_pct:null, poll_start_date:'2026-01-20', poll_end_date:'2026-01-22', sample_size:1014, margin_of_error:3.1, poll_method:'전화면접', source_url:null },
  // ── 대전광역시 ──────────────────────────────────────────────────────
  { politician_id:null, politician_name:'강훈식', party:'더불어민주당', region:'대전광역시', poll_agency:'대전일보', poll_scope:'regional', poll_rank:1, poll_support_pct:26.7, poll_start_date:'2026-01-06', poll_end_date:'2026-01-07', sample_size:1002, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2257426' },
  { politician_id:null, politician_name:'김태흠', party:'국민의힘', region:'대전광역시', poll_agency:'대전일보', poll_scope:'regional', poll_rank:2, poll_support_pct:15.6, poll_start_date:'2026-01-06', poll_end_date:'2026-01-07', sample_size:1002, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2257426' },
  { politician_id:null, politician_name:'이장우', party:'국민의힘', region:'대전광역시', poll_agency:'대전일보', poll_scope:'regional', poll_rank:3, poll_support_pct:11.6, poll_start_date:'2026-01-06', poll_end_date:'2026-01-07', sample_size:1002, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2257426' },
  // ── 세종특별자치시 ──────────────────────────────────────────────────
  { politician_id:null, politician_name:'최민호', party:'국민의힘', region:'세종특별자치시', poll_agency:'대전일보', poll_scope:'regional', poll_rank:1, poll_support_pct:17.6, poll_start_date:'2026-03-08', poll_end_date:'2026-03-09', sample_size:810, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2262384' },
  { politician_id:null, politician_name:'조상호', party:'더불어민주당', region:'세종특별자치시', poll_agency:'대전일보', poll_scope:'regional', poll_rank:2, poll_support_pct:16.4, poll_start_date:'2026-03-08', poll_end_date:'2026-03-09', sample_size:810, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2262384' },
  { politician_id:null, politician_name:'이춘희', party:'더불어민주당', region:'세종특별자치시', poll_agency:'대전일보', poll_scope:'regional', poll_rank:3, poll_support_pct:15.3, poll_start_date:'2026-03-08', poll_end_date:'2026-03-09', sample_size:810, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.daejonilbo.com/news/articleView.html?idxno=2262384' },
  // ── 충청북도 ────────────────────────────────────────────────────────
  { politician_id:null, politician_name:'김영환', party:'국민의힘', region:'충청북도', poll_agency:'KBS청주', poll_scope:'regional', poll_rank:1, poll_support_pct:10.0, poll_start_date:'2026-01-13', poll_end_date:'2026-01-15', sample_size:1004, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://v.daum.net/v/20260119213646636' },
  { politician_id:null, politician_name:'신용한', party:'국민의힘', region:'충청북도', poll_agency:'KBS청주', poll_scope:'regional', poll_rank:2, poll_support_pct:9.0, poll_start_date:'2026-01-13', poll_end_date:'2026-01-15', sample_size:1004, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://v.daum.net/v/20260119213646636' },
  { politician_id:null, politician_name:'노영민', party:'더불어민주당', region:'충청북도', poll_agency:'KBS청주', poll_scope:'regional', poll_rank:3, poll_support_pct:8.0, poll_start_date:'2026-01-13', poll_end_date:'2026-01-15', sample_size:1004, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://v.daum.net/v/20260119213646636' },
  { politician_id:null, politician_name:'송기섭', party:'더불어민주당', region:'충청북도', poll_agency:'KBS청주', poll_scope:'regional', poll_rank:4, poll_support_pct:8.0, poll_start_date:'2026-01-13', poll_end_date:'2026-01-15', sample_size:1004, margin_of_error:3.1, poll_method:'전화면접', source_url:'https://v.daum.net/v/20260119213646636' },
  // ── 전라북도 ────────────────────────────────────────────────────────
  { politician_id:null, politician_name:'김관영', party:'더불어민주당', region:'전라북도', poll_agency:'뉴스1', poll_scope:'regional', poll_rank:1, poll_support_pct:35.0, poll_start_date:'2026-02-18', poll_end_date:'2026-02-20', sample_size:806, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.news1.kr/local/jeonbuk/6066530' },
  { politician_id:null, politician_name:'이원택', party:'더불어민주당', region:'전라북도', poll_agency:'뉴스1', poll_scope:'regional', poll_rank:2, poll_support_pct:28.2, poll_start_date:'2026-02-18', poll_end_date:'2026-02-20', sample_size:806, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.news1.kr/local/jeonbuk/6066530' },
  // ── 경상북도 ────────────────────────────────────────────────────────
  { politician_id:null, politician_name:'이철우', party:'국민의힘', region:'경상북도', poll_agency:'대구일보', poll_scope:'regional', poll_rank:1, poll_support_pct:22.7, poll_start_date:'2025-11-27', poll_end_date:'2025-11-29', sample_size:806, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.idaegu.com/news/articleView.html?idxno=657149' },
  { politician_id:null, politician_name:'김재원', party:'국민의힘', region:'경상북도', poll_agency:'대구일보', poll_scope:'regional', poll_rank:2, poll_support_pct:18.2, poll_start_date:'2025-11-27', poll_end_date:'2025-11-29', sample_size:806, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.idaegu.com/news/articleView.html?idxno=657149' },
  { politician_id:null, politician_name:'최경환', party:'국민의힘', region:'경상북도', poll_agency:'대구일보', poll_scope:'regional', poll_rank:3, poll_support_pct:8.9, poll_start_date:'2025-11-27', poll_end_date:'2025-11-29', sample_size:806, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.idaegu.com/news/articleView.html?idxno=657149' },
  { politician_id:null, politician_name:'이철우', party:'국민의힘', region:'경상북도', poll_agency:'경북매일신문', poll_scope:'regional', poll_rank:1, poll_support_pct:26.3, poll_start_date:'2026-01-04', poll_end_date:'2026-01-06', sample_size:804, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.moneys.co.kr/article/2026010612041275914' },
  { politician_id:null, politician_name:'김재원', party:'국민의힘', region:'경상북도', poll_agency:'경북매일신문', poll_scope:'regional', poll_rank:2, poll_support_pct:19.0, poll_start_date:'2026-01-04', poll_end_date:'2026-01-06', sample_size:804, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.moneys.co.kr/article/2026010612041275914' },
  { politician_id:null, politician_name:'최경환', party:'국민의힘', region:'경상북도', poll_agency:'경북매일신문', poll_scope:'regional', poll_rank:3, poll_support_pct:14.0, poll_start_date:'2026-01-04', poll_end_date:'2026-01-06', sample_size:804, margin_of_error:3.5, poll_method:'전화면접', source_url:'https://www.moneys.co.kr/article/2026010612041275914' },
];

async function main() {
  console.log(`Inserting ${rows.length} rows...`);

  const { error } = await supabase
    .from('metro_poll_results')
    .upsert(rows, { onConflict: 'poll_agency,region,poll_start_date,poll_end_date,politician_name', ignoreDuplicates: true });

  if (error) {
    console.error('Insert error:', error.message);
    return;
  }

  // 결과 확인
  const { count } = await supabase
    .from('metro_poll_results')
    .select('*', { count: 'exact', head: true });

  console.log('Done! Total rows in DB:', count);

  // 지역별 집계
  const { data: regions } = await supabase
    .from('metro_poll_results')
    .select('region')
    .order('region');

  const regionSet = [...new Set(regions.map(r => r.region))];
  console.log(`Regions covered (${regionSet.length}):`, regionSet.join(', '));
}

main();
