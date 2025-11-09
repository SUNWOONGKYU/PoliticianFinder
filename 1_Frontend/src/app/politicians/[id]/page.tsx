'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Politician {
  id: string;
  name: string;
  nameKanji: string;
  status: string;
  position: string;
  party: string;
  region: string;
  birthDate: string;
  age: number;
  gender: string;
  claudeScore: number;
  totalScore: number;
  grade: string;
  lastUpdated: string;
}

const SAMPLE_POLITICIAN: Politician = {
  id: 'POL001',
  name: '김민준',
  nameKanji: '金民俊',
  status: '현직 국회의원 (21대)',
  position: '국회의원',
  party: '더불어민주당',
  region: '서울 강남구',
  birthDate: '1975.03.15',
  age: 50,
  gender: '남',
  claudeScore: 970,
  totalScore: 950,
  grade: '🌺 Mugunghwa',
  lastUpdated: '2025.01.20 14:30',
};

const AI_SCORES = [
  { name: 'Claude', score: 970, color: '#f97316' },
  { name: 'ChatGPT', score: 950, color: '#00a67e' },
  { name: 'Gemini', score: 930, color: '#4285f4' },
  { name: 'Grok', score: 960, color: '#000000' },
  { name: 'Perplexity', score: 940, color: '#8b5cf6' },
];

const CHART_DATA = [
  { month: '2024-08', total: 867, claude: 880, chatgpt: 870, gemini: 850, grok: 875, perplexity: 860 },
  { month: '2024-09', total: 878, claude: 895, chatgpt: 880, gemini: 860, grok: 885, perplexity: 870 },
  { month: '2024-10', total: 882, claude: 900, chatgpt: 885, gemini: 865, grok: 890, perplexity: 875 },
  { month: '2024-11', total: 890, claude: 910, chatgpt: 890, gemini: 870, grok: 900, perplexity: 880 },
  { month: '2024-12', total: 894, claude: 915, chatgpt: 895, gemini: 875, grok: 905, perplexity: 885 },
  { month: '2025-01', total: 950, claude: 970, chatgpt: 950, gemini: 930, grok: 960, perplexity: 940 },
];

const CATEGORY_SCORES = [
  { category: '청렴성', score: 92 },
  { category: '전문성', score: 88 },
  { category: '소통능력', score: 85 },
  { category: '리더십', score: 90 },
  { category: '책임감', score: 87 },
  { category: '투명성', score: 91 },
  { category: '대응성', score: 83 },
  { category: '비전', score: 89 },
  { category: '공익추구', score: 93 },
  { category: '윤리성', score: 90 },
];

export default function PoliticianDetailPage() {
  const params = useParams();
  const politicianId = params?.id as string;

  const [politician, setPolitician] = useState<Politician>(SAMPLE_POLITICIAN);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAIDetailModal, setShowAIDetailModal] = useState(false);
  const [selectedAI, setSelectedAI] = useState<string>('');

  // API에서 정치인 상세 정보 가져오기
  useEffect(() => {
    const fetchPoliticianDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/politicians/${politicianId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch politician details');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setPolitician(data.data);
        }
      } catch (err) {
        console.error('Error fetching politician:', err);
        // 에러 발생시 샘플 데이터 유지
      } finally {
        setLoading(false);
      }
    };

    if (politicianId && politicianId !== SAMPLE_POLITICIAN.id) {
      fetchPoliticianDetail();
    } else {
      setLoading(false);
    }
  }, [politicianId]);

  const handleReportToggle = useCallback((aiName: string) => {
    setSelectedReports((prev) =>
      prev.includes(aiName) ? prev.filter((name) => name !== aiName) : [...prev, aiName]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedReports.length === AI_SCORES.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(AI_SCORES.map((ai) => ai.name));
    }
  }, [selectedReports.length]);

  const totalPrice = useMemo(() => {
    if (selectedReports.length === AI_SCORES.length) {
      return 2500000;
    }
    return selectedReports.length * 500000;
  }, [selectedReports.length]);

  const openAIDetailModal = (aiName: string) => {
    setSelectedAI(aiName);
    setShowAIDetailModal(true);
  };

  const handlePurchase = () => {
    if (selectedReports.length === 0) {
      alert('구매할 상세평가보고서를 선택해주세요.');
      return;
    }
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    window.location.href = '/payment';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-primary-600">홈</Link></li>
            <li>›</li>
            <li><Link href="/politicians" className="hover:text-primary-600">정치인 목록</Link></li>
            <li>›</li>
            <li className="text-gray-900 font-medium">{politician.name}</li>
          </ol>
        </nav>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">정치인 상세페이지</h1>
        </div>

        {/* [1] 기본 정보 섹션 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">이름</span>
              <span className="text-gray-900 font-bold text-lg">{politician.name} ({politician.nameKanji})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">신분/직책</span>
              <span className="text-gray-900">{politician.status}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">출마직종</span>
              <span className="text-gray-900">{politician.position}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">소속 정당</span>
              <span className="text-gray-900">{politician.party}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">지역</span>
              <span className="text-gray-900">{politician.region}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">생년월일</span>
              <span className="text-gray-900">{politician.birthDate} ({politician.age}세)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">성별</span>
              <span className="text-gray-900">{politician.gender}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">클로드 평점</span>
              <span className="text-accent-600 font-bold text-lg">{politician.claudeScore}점</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">종합평점</span>
              <span className="text-accent-600 font-bold text-lg">{politician.totalScore}점</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium w-24">평가등급</span>
              <span className="text-accent-600 font-bold text-lg">{politician.grade}</span>
            </div>
          </div>
        </section>

        {/* [2] AI 평가 정보 섹션 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AI 평가 정보</h2>
            <div className="text-sm text-gray-600">
              최종 갱신: {politician.lastUpdated}
            </div>
          </div>

          {/* 시계열 그래프 */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-center font-bold mb-4">AI 평가 점수 추이 (월별)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[800, 1000]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#dc2626" strokeWidth={3} name="종합평점" />
                  <Line type="monotone" dataKey="claude" stroke="#f97316" strokeWidth={2} name="Claude" />
                  <Line type="monotone" dataKey="chatgpt" stroke="#00a67e" strokeWidth={2} name="ChatGPT" />
                  <Line type="monotone" dataKey="gemini" stroke="#4285f4" strokeWidth={2} name="Gemini" />
                  <Line type="monotone" dataKey="grok" stroke="#000000" strokeWidth={2} name="Grok" />
                  <Line type="monotone" dataKey="perplexity" stroke="#8b5cf6" strokeWidth={2} name="Perplexity" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI별 현재 점수 및 평가내역보기 버튼 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {AI_SCORES.map((ai) => (
              <div key={ai.name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col items-center gap-2 mb-3">
                  <span className="font-medium text-gray-900 text-sm">{ai.name}</span>
                  <span className="text-xl font-bold text-accent-600">{ai.score}점</span>
                </div>
                <button
                  onClick={() => openAIDetailModal(ai.name)}
                  className="w-full px-3 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition"
                >
                  평가내역보기
                </button>
              </div>
            ))}
          </div>

          {/* 상세평가보고서 구매 섹션 */}
          <div className="bg-primary-50 rounded-lg p-6 border-2 border-primary-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📊 상세평가보고서 구매</h3>
            <p className="text-base text-gray-900 mb-3">
              <strong className="text-lg">보다 상세한 AI 평가 내역이 궁금하신가요?</strong><br/>
              10개 분야별, 세부 항목별 상세 평가 내역이 정리된 보고서(30,000자 분량)를 PDF로 제공해드립니다.
            </p>

            {/* AI 선택 옵션 */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="text-sm font-medium text-gray-900 mb-3">AI 선택 (개당 ₩500,000)</div>
              <div className="space-y-2">
                {AI_SCORES.map((ai) => (
                  <label key={ai.name} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(ai.name)}
                      onChange={() => handleReportToggle(ai.name)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-300"
                    />
                    <span className="text-sm text-gray-700">{ai.name} 상세평가보고서</span>
                  </label>
                ))}
                <div className="pt-2 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === AI_SCORES.length}
                      onChange={handleToggleAll}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-300"
                    />
                    <span className="text-sm font-bold text-gray-900">전체 정치인 AI 상세평가보고서 (5개) - ₩2,500,000</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">선택 금액</div>
                <div className="text-2xl font-bold text-primary-600">₩{totalPrice.toLocaleString()}</div>
              </div>
              <button
                onClick={handlePurchase}
                className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={selectedReports.length === 0}
              >
                상세평가보고서 구매
              </button>
            </div>

            {/* 유의사항 */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-bold text-primary-600 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                유의사항
              </h4>
              <ul className="text-sm text-gray-700 space-y-1.5 ml-7">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>본인 구매 제한:</strong> 상세평가보고서는 해당 정치인 본인만 구매 가능합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>본인 인증 필수:</strong> 구매 시 본인 확인 절차가 진행됩니다 (이름, 생년월일, 소속 정당, 지역 일치 확인).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>평가점수 변동:</strong> 보고서는 실제 발행(구매) 시점의 평가 점수 및 내용이 기록됩니다. 현재 화면에 표시된 점수와 보고서 발행 시점의 점수가 다를 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>추가 구매:</strong> 최신 평가 내용이 필요한 경우 새로운 보고서를 추가로 구매하실 수 있습니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* [3] 커뮤니티 활동 정보 섹션 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">커뮤니티 활동 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 작성한 게시글 */}
            <Link href={`/community?filter=politician&author=${politician.name}`} className="block bg-primary-50 rounded-lg p-6 border-2 border-primary-200 hover:border-primary-400 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-primary-700 mb-1">🏛️ 작성한 게시글</div>
                  <div className="text-3xl font-bold text-primary-600">12개</div>
                  <div className="text-xs text-gray-600 mt-1">(받은 공감 234개)</div>
                </div>
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>

            {/* 태깅된 게시글 */}
            <Link href={`/community?filter=general&tagged=${politician.name}`} className="block bg-purple-50 rounded-lg p-6 border-2 border-purple-200 hover:border-purple-400 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-purple-700 mb-1">💬 태깅된 게시글</div>
                  <div className="text-3xl font-bold text-purple-600">45개</div>
                  <div className="text-xs text-gray-600 mt-1">(회원들이 이 정치인에 대해 작성)</div>
                </div>
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          </div>

          <div className="text-sm text-gray-500 text-center">
            클릭하시면 해당 게시글 목록으로 이동합니다
          </div>
        </section>

        {/* [4] 선관위 공식 정보 섹션 */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">선거관리위원회 공식 정보</h2>

          <div className="space-y-4">
            {/* 학력 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">학력</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>서울대학교 법학과 졸업 (1998년)</li>
                <li>하버드 대학교 공공정책대학원 석사 (2005년)</li>
                <li>서울 강남고등학교 졸업 (1993년)</li>
              </ul>
            </div>

            {/* 경력 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">경력</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>前 국회 법제사법위원회 위원 (2020~2024)</li>
                <li>前 더불어민주당 정책위원회 부의장 (2018~2020)</li>
                <li>前 법무법인 광장 변호사 (2008~2015)</li>
                <li>前 대통령비서실 행정관 (2006~2008)</li>
              </ul>
            </div>

            {/* 당선 이력 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">당선 이력</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>제21대 국회의원 (2020년 당선, 서울 강남구)</li>
                <li>제20대 국회의원 (2016년 당선, 서울 강남구)</li>
              </ul>
            </div>

            {/* 병역 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">병역</h3>
              <p className="text-gray-700">육군 만기 제대 (1999~2001)</p>
            </div>

            {/* 재산 공개 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">재산 공개</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>총 재산: 약 15억원 (2024년 기준)</li>
                <li>부동산: 약 12억원 (서울 강남구 아파트)</li>
                <li>금융자산: 약 3억원</li>
              </ul>
            </div>

            {/* 세금 체납 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">세금 체납</h3>
              <p className="text-gray-700">없음</p>
            </div>

            {/* 범죄 경력 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">범죄 경력</h3>
              <p className="text-gray-700">없음</p>
            </div>

            {/* 병역 의혹 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">병역 의혹</h3>
              <p className="text-gray-700">없음</p>
            </div>

            {/* 위장전입 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">위장전입</h3>
              <p className="text-gray-700">없음</p>
            </div>

            {/* 공약 사항 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">주요 공약</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>강남구 교통 혼잡 완화 (GTX-C 조기 개통)</li>
                <li>청년 주택 공급 확대 (연 1,000가구)</li>
                <li>노후 학교 시설 현대화 (10개교)</li>
              </ul>
            </div>

            {/* 의정 활동 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">의정 활동</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>출석률: 95% (21대 국회 평균 92%)</li>
                <li>발의 법안: 42건 (대표 발의 28건, 공동 발의 14건)</li>
                <li>가결된 법안: 18건</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* AI 평가 상세 모달 */}
      {showAIDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-900">{politician.name} 의원 - {selectedAI} 평가 내역</h3>
              <button onClick={() => setShowAIDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* 10개 분야 점수 */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">10개 분야별 평가 점수</h4>
              <div className="space-y-3">
                {CATEGORY_SCORES.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{index + 1}. {item.category}</span>
                      <span className="text-sm font-bold text-accent-600">{item.score}점</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-accent-500 h-2 rounded-full" style={{ width: `${item.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 강점 */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3">강점</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-700">재산공개 투명, 부패의혹 없음 (청렴성)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-700">법안 통과율 높음, 전문성 우수 (전문성)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-700">SNS 활발, 주민간담회 정기 개최 (소통능력)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-gray-700">공익 법안 다수 발의, 지역 현안 해결 (공익추구)</span>
                </li>
              </ul>
            </div>

            {/* 개선점 */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3">개선점</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span className="text-gray-700">일부 공약 이행 지연 (책임감)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span className="text-gray-700">민원 처리 속도 개선 필요 (대응성)</span>
                </li>
              </ul>
            </div>

            {/* 종합 평가 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-bold text-gray-900 mb-3">종합 평가</h4>
              <p className="text-gray-700 leading-relaxed">
                전반적으로 우수한 평가를 받았으며, 특히 청렴성과 공익추구 분야에서 뛰어난 성과를 보였습니다.
                법안 통과율이 높고 전문성이 우수하며, SNS와 주민간담회를 통한 활발한 소통으로 좋은 평가를 받았습니다.
                다만, 일부 공약 이행 지연과 민원 처리 속도 개선이 필요한 것으로 나타났습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 구매 확인 모달 */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-900">정치인 AI 상세평가보고서 구매</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                선택한 정치인 AI 상세평가보고서를 구매하시겠습니까?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 mb-2">선택한 보고서</div>
                <div className="text-sm text-gray-900 space-y-1 mb-3">
                  {selectedReports.map((ai) => (
                    <div key={ai}>• {ai} 상세평가보고서 - ₩500,000</div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">총 금액</span>
                    <span className="text-xl font-bold text-primary-600">₩{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                * 구매 시 본인 확인 절차가 진행됩니다<br/>
                * 환불 불가
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPurchaseModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                취소
              </button>
              <button onClick={confirmPurchase} className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                구매하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
