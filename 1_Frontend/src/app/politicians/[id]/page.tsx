// P3BA28: 관심 등록 버튼 추가
// H13: 정치인 상세 탭 네비게이션 추가
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Politician } from '@/types/politician';
import FavoriteButton from '@/components/FavoriteButton';
import { LoadingPage } from '@/components/ui/Spinner';

const SAMPLE_POLITICIAN: Politician = {
  id: 'POL001',
  name: '김민준',
  nameKanji: '金民俊',
  nameEn: 'Kim Min-jun',
  identity: '현직',
  title: '국회의원 (21대)',
  position: '국회의원',
  party: '더불어민주당',
  region: '서울 강남구',
  district: '강남구 갑',
  birthDate: '1975.03.15',
  age: 50,
  gender: '남',
  claudeScore: 970,
  totalScore: 950,
  grade: 'M',
  gradeEmoji: '🌺',
  lastUpdated: '2025.01.20 14:30',
  postCount: 12,
  likeCount: 234,
  taggedCount: 45,
  education: ['서울대학교 법학과 졸업 (1998년)', '하버드 대학교 공공정책대학원 석사 (2005년)', '서울 강남고등학교 졸업 (1993년)'],
  career: ['前 국회 법제사법위원회 위원 (2020~2024)', '前 더불어민주당 정책위원회 부의장 (2018~2020)', '前 법무법인 광장 변호사 (2008~2015)', '前 대통령비서실 행정관 (2006~2008)'],
  electionHistory: ['제21대 국회의원 (2020년 당선, 서울 강남구)', '제20대 국회의원 (2016년 당선, 서울 강남구)'],
  militaryService: '육군 만기 제대 (1999~2001)',
  assets: {
    total: '약 15억원 (2024년 기준)',
    real_estate: '약 12억원 (서울 강남구 아파트)',
    financial: '약 3억원'
  },
  taxArrears: '없음',
  criminalRecord: '없음',
  militaryServiceIssue: '없음',
  residencyFraud: '없음',
  pledges: ['강남구 교통 혼잡 완화 (GTX-C 조기 개통)', '청년 주택 공급 확대 (연 1,000가구)', '노후 학교 시설 현대화 (10개교)'],
  legislativeActivity: {
    attendance_rate: '95% (21대 국회 평균 92%)',
    bills_proposed: 42,
    bills_representative: 28,
    bills_co_proposed: 14,
    bills_passed: 18
  },
  profileImageUrl: null,
  websiteUrl: null,
  bio: '',
  phone: '',
  email: '',
  twitterHandle: '',
  facebookUrl: '',
  instagramHandle: '',
  verifiedAt: null,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2025-01-20T14:30:00Z',
  userRating: 0,
  ratingCount: 0
};

// P3BA35: AI_SCORES는 더 이상 하드코딩하지 않음
// V24.0 시스템에서는 Claude AI만 평가를 수행하며, totalScore를 사용
// 향후 다중 AI 평가 지원 시 API에서 동적으로 제공

// H9: 확장된 차트 데이터 (12개월)
const CHART_DATA_FULL = [
  { month: '2024-02', total: 845, claude: 860, chatgpt: 850, grok: 855 },
  { month: '2024-03', total: 850, claude: 865, chatgpt: 855, grok: 860 },
  { month: '2024-04', total: 855, claude: 870, chatgpt: 860, grok: 865 },
  { month: '2024-05', total: 858, claude: 872, chatgpt: 862, grok: 868 },
  { month: '2024-06', total: 862, claude: 875, chatgpt: 865, grok: 870 },
  { month: '2024-07', total: 865, claude: 878, chatgpt: 868, grok: 873 },
  { month: '2024-08', total: 867, claude: 880, chatgpt: 870, grok: 875 },
  { month: '2024-09', total: 878, claude: 895, chatgpt: 880, grok: 885 },
  { month: '2024-10', total: 882, claude: 900, chatgpt: 885, grok: 890 },
  { month: '2024-11', total: 890, claude: 910, chatgpt: 890, grok: 900 },
  { month: '2024-12', total: 894, claude: 915, chatgpt: 895, grok: 905 },
  { month: '2025-01', total: 950, claude: 970, chatgpt: 950, grok: 960 },
];

// H9: 기간별 필터링 옵션
type ChartPeriod = '3m' | '6m' | '12m';
const CHART_PERIODS: { id: ChartPeriod; label: string }[] = [
  { id: '3m', label: '3개월' },
  { id: '6m', label: '6개월' },
  { id: '12m', label: '12개월' },
];

// P3BA35: CATEGORY_SCORES는 하드코딩 제거 - API categoryScores 사용
// V24.0 시스템에서 카테고리명은 DB에서 동적으로 가져옴
const CATEGORY_NAMES: Record<number, string> = {
  1: '청렴성',
  2: '전문성',
  3: '소통능력',
  4: '정책능력',
  5: '리더십',
  6: '책임성',
  7: '투명성',
  8: '혁신성',
  9: '포용성',
  10: '효율성',
};

export default function PoliticianDetailPage() {
  const params = useParams();
  const politicianId = params?.id as string;

  const [politician, setPolitician] = useState<Politician>(SAMPLE_POLITICIAN);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAIDetailModal, setShowAIDetailModal] = useState(false);
  const [selectedAI, setSelectedAI] = useState<string>('');

  // 별점 평가 상태
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // 플로팅 버튼용 상태
  const [isFavoriteFloating, setIsFavoriteFloating] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  // 정치인 본인 인증 상태 (상세평가보고서 구매 섹션 표시 여부)
  const [isVerifiedOwner, setIsVerifiedOwner] = useState(false);

  // H13: 탭 네비게이션용 상태
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [showStickyNav, setShowStickyNav] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // 탭 정의
  const tabs = [
    { id: 'basic', label: '기본 정보', icon: '📋' },
    { id: 'ai-eval', label: 'AI 평가', icon: '🤖' },
    { id: 'community', label: '커뮤니티', icon: '💬' },
    { id: 'official', label: '공식 정보', icon: '🏛️' },
  ];

  // H9: 차트 기간 상태 및 필터링된 데이터
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('6m');
  const chartData = useMemo(() => {
    const monthCount = chartPeriod === '3m' ? 3 : chartPeriod === '6m' ? 6 : 12;
    return CHART_DATA_FULL.slice(-monthCount);
  }, [chartPeriod]);

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

  // 정치인 본인 인증 상태 확인 (상세평가보고서 구매 섹션 표시 여부)
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!politicianId) return;

      try {
        const response = await fetch(`/api/politicians/verification/status/${politicianId}`);
        if (response.ok) {
          const data = await response.json();
          // 현재 사용자가 이 정치인으로 인증된 경우에만 true
          // verification_history가 있고 approved 상태인 경우
          if (data.success && data.data?.verification_history) {
            const hasApprovedVerification = data.data.verification_history.some(
              (v: { status: string }) => v.status === 'approved'
            );
            setIsVerifiedOwner(hasApprovedVerification);
          }
        }
      } catch (error) {
        console.error('Verification status check failed:', error);
        setIsVerifiedOwner(false);
      }
    };

    checkVerificationStatus();
  }, [politicianId]);

  const handleReportToggle = useCallback((aiName: string) => {
    setSelectedReports((prev) =>
      prev.includes(aiName) ? prev.filter((name) => name !== aiName) : [...prev, aiName]
    );
  }, []);

  // P3BA35: V24.0에서는 Claude AI만 사용하므로 단순화
  const handleToggleAll = useCallback(() => {
    if (selectedReports.length > 0) {
      setSelectedReports([]);
    } else {
      setSelectedReports(['Claude']);
    }
  }, [selectedReports.length]);

  // P3BA35: 상세평가보고서 가격 계산 (Claude 1개만 지원)
  const totalPrice = useMemo(() => {
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

  const handleRatingSubmit = async () => {
    if (userRating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/ratings/${politicianId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: userRating })
      });

      const data = await response.json();

      if (response.ok) {
        alert('평가가 완료되었습니다!');
        setShowRatingModal(false);
        setUserRating(0);
        // Refresh politician data
        setPolitician(prev => ({
          ...prev,
          userRating: data.averageRating,
          ratingCount: data.ratingCount
        }));
      } else {
        // 에러 처리
        if (response.status === 401) {
          alert('로그인이 필요합니다.');
          window.location.href = '/auth/login';
        } else {
          alert(data.error || '평가 제출에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Rating submit error:', error);
      alert('평가 제출 중 오류가 발생했습니다.');
    }
  };

  // 플로팅 버튼용 관심 정치인 등록 확인
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const isFav = data.data.some((fav: any) => fav.politician_id === politicianId);
            setIsFavoriteFloating(isFav);
          }
        }
      } catch (err) {
        console.error('Error checking favorite:', err);
      }
    };

    checkFavorite();
  }, [politicianId]);

  // H13: 스크롤 감지로 스티키 네비게이션 표시/숨김 및 활성 탭 업데이트
  useEffect(() => {
    const handleScroll = () => {
      // Hero 섹션 아래로 스크롤되면 스티키 네비게이션 표시
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setShowStickyNav(heroBottom < 80);
      }

      // 현재 보이는 섹션 감지
      const sections = ['basic', 'ai-eval', 'community', 'official'];
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveTab(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // H13: 탭 클릭 시 해당 섹션으로 스크롤
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      setActiveTab(sectionId);
    }
  }, []);

  // 플로팅 버튼용 관심 정치인 토글
  const handleToggleFavoriteFloating = async () => {
    setLoadingFavorite(true);

    try {
      if (isFavoriteFloating) {
        // 관심 취소
        const response = await fetch(`/api/favorites?politician_id=${politicianId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavoriteFloating(false);
          alert(`${politician.name} 님을 관심 정치인에서 제거했습니다.`);
        } else {
          const data = await response.json();
          alert(data.error || '관심 취소에 실패했습니다.');
        }
      } else {
        // 관심 등록
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            politician_id: politicianId,
            notification_enabled: true,
          }),
        });

        if (response.ok) {
          setIsFavoriteFloating(true);
          alert(`${politician.name} 님을 관심 정치인으로 등록했습니다.`);
        } else {
          const data = await response.json();
          if (response.status === 401) {
            alert('로그인이 필요합니다.');
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 1000);
          } else {
            alert(data.error || '관심 등록에 실패했습니다.');
          }
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoadingFavorite(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingPage message="정치인 정보를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb - 모바일 접근성을 위해 최소 14px */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm sm:text-base text-gray-600 min-h-touch">
            <li><Link href="/" className="hover:text-primary-600 py-1">홈</Link></li>
            <li>›</li>
            <li><Link href="/politicians" className="hover:text-primary-600 py-1">정치인 목록</Link></li>
            <li>›</li>
            <li className="text-gray-900 font-medium py-1">{politician.name}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section ref={heroRef} className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-2xl shadow-2xl overflow-hidden mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative px-6 py-8 md:px-12 md:py-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  {politician.profileImageUrl ? (
                    <img
                      src={politician.profileImageUrl}
                      alt={politician.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-500">
                      <svg className="w-20 h-20 md:w-24 md:h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                {/* Favorite Badge - 아이콘만 표시 */}
                <div className="absolute -bottom-1 -right-1">
                  <FavoriteButton
                    politicianId={String(politician.id)}
                    politicianName={politician.name}
                    compact={true}
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left text-white">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold">{politician.name}</h1>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    {politician.party}
                  </span>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">
                    {politician.identity}
                  </span>
                  {politician.title && (
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">
                      {politician.title}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm">
                    {politician.position}
                  </span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-2 text-lg mb-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{politician.region} {politician.district}</span>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="px-8 py-3 bg-white text-primary-600 rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 mx-auto md:mx-0 min-h-[44px]"
                  aria-label={`${politician.name} 별점 평가`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  별점 평가하기
                </button>
              </div>

              {/* Score Cards - 순서: AI 평점 → 등급 → 회원 평가 */}
              <div className="grid grid-cols-3 md:grid-cols-1 gap-3 w-full md:w-auto">
                {/* AI Score */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                  <div className="text-sm text-white/80 mb-1">AI 평점</div>
                  <div className="text-2xl md:text-3xl font-bold text-white">{politician.totalScore}</div>
                  <div className="text-sm text-white/80 mt-1">/ 1000점</div>
                </div>

                {/* Grade Badge - AI 평점 바로 다음 */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                  <div className="text-sm text-white/80 mb-1">등급</div>
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {politician.grade === 'M' && '🌺 Mugunghwa'}
                    {politician.grade === 'D' && '💎 Diamond'}
                    {politician.grade === 'E' && '💚 Emerald'}
                    {politician.grade === 'P' && '🥇 Platinum'}
                    {politician.grade === 'G' && '🥇 Gold'}
                    {politician.grade === 'S' && '🥈 Silver'}
                    {politician.grade === 'B' && '🥉 Bronze'}
                    {politician.grade === 'I' && '⚫ Iron'}
                    {politician.grade === 'Tn' && '⬜ Tin'}
                    {politician.grade === 'L' && '⬛ Lead'}
                    {!politician.grade && '-'}
                  </div>
                </div>

                {/* Member Rating - 숫자 없이 별만 표시 */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                  <div className="text-sm text-white/80 mb-1">회원 평가</div>
                  <div className="text-2xl md:text-3xl font-bold text-yellow-300">
                    {politician.userRating > 0 ? '★'.repeat(Math.round(politician.userRating)) : '-'}
                  </div>
                  <div className="text-sm text-white/80 mt-1">{politician.ratingCount}명 참여</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* H13: 스티키 탭 네비게이션 */}
        <nav
          className={`sticky top-16 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${
            showStickyNav ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`flex-1 min-w-max px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 min-h-touch ${
                  activeTab === tab.id
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* [1] 기본 정보 섹션 (상세) */}
        <section id="basic" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 scroll-mt-32">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">상세 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">한자명</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.nameKanji}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">영문명</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.nameEn}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">소속 정당</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.party}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">지역</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.region}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">생년월일</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.birthDate} ({politician.age}세)</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">성별</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.gender}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">클로드 평점</span>
              <span className="text-accent-600 dark:text-accent-400 font-bold text-lg">{politician.claudeScore}점</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">종합평점</span>
              <span className="text-accent-600 dark:text-accent-400 font-bold text-lg">{politician.totalScore}점</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">평가등급</span>
              <span className="text-accent-600 dark:text-accent-400 font-bold text-lg">{politician.gradeEmoji} {politician.grade}</span>
            </div>
          </div>
        </section>

        {/* [2] AI 평가 정보 섹션 */}
        <section id="ai-eval" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 scroll-mt-32">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI 평가 정보</h2>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              최종 갱신: {politician.lastUpdated}
            </div>
          </div>

          {/* P3BA35: 시계열 그래프 - 준비 중 안내 (API 시계열 데이터 미지원) */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 md:p-6">
              <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white mb-4">AI 평가 점수 추이</h3>
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium mb-2">점수 추이 차트 준비 중</p>
                <p className="text-sm">월별 평가 점수 변화를 추적하는 기능이 곧 제공될 예정입니다.</p>
              </div>
            </div>
          </div>

          {/* P3BA35: V24.0 AI 종합 점수 표시 (하드코딩 제거) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* AI 종합 점수 카드 */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 border border-primary-100 dark:border-gray-600">
              <div className="flex flex-col items-center gap-2 mb-3">
                <span className="font-medium text-gray-900 dark:text-white text-base">Claude AI 평가</span>
                <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{politician.totalScore || 0}점</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ 1000점 만점</span>
              </div>
              <button
                onClick={() => openAIDetailModal('Claude')}
                className="w-full px-3 py-2.5 bg-primary-500 text-white text-base font-medium rounded-lg hover:bg-primary-600 transition min-h-[44px]"
              >
                카테고리별 상세 보기
              </button>
            </div>

            {/* 등급 카드 */}
            <div className="bg-gradient-to-br from-secondary-50 to-amber-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 border border-secondary-100 dark:border-gray-600">
              <div className="flex flex-col items-center gap-2 mb-3">
                <span className="font-medium text-gray-900 dark:text-white text-base">평가 등급</span>
                <span className="text-4xl">{politician.gradeEmoji || '⬜'}</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {politician.gradeName || politician.grade || '미평가'}
                </span>
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                V24.0 10단계 금속 등급 체계
              </div>
            </div>
          </div>

          {/* 상세평가보고서 구매 섹션 - 정치인 본인 인증 완료 시에만 표시 */}
          {isVerifiedOwner && (
          <div className="bg-primary-50 rounded-lg p-6 border-2 border-primary-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📊 상세평가보고서 구매</h3>
            <p className="text-base text-gray-900 mb-3">
              <strong className="text-lg">보다 상세한 AI 평가 내역이 궁금하신가요?</strong><br/>
              10개 분야별, 세부 항목별 상세 평가 내역이 정리된 보고서(30,000자 분량)를 PDF로 제공해드립니다.
            </p>

            {/* P3BA35: V24.0에서는 Claude AI만 사용 - 단순화된 UI */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="text-base font-medium text-gray-900 mb-3">Claude AI 상세평가보고서 (₩500,000)</div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes('Claude')}
                    onChange={() => handleReportToggle('Claude')}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-300"
                  />
                  <span className="text-base text-gray-700">Claude AI 상세평가보고서</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-base text-gray-600 mb-1">선택 금액</div>
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
          )}
        </section>

        {/* [3] 커뮤니티 활동 정보 섹션 */}
        <section id="community" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 scroll-mt-32">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">커뮤니티 활동 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 작성한 게시글 */}
            <Link href={`/community?filter=politician&author=${politician.name}`} className="block bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border-2 border-primary-200 dark:border-primary-700 hover:border-primary-400 transition cursor-pointer min-h-[100px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-primary-700 dark:text-primary-300 mb-1">🏛️ 작성한 게시글</div>
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{politician.postCount || 0}개</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">(받은 공감 {politician.likeCount || 0}개)</div>
                </div>
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>

            {/* 태깅된 게시글 */}
            <Link href={`/community?filter=general&tagged=${politician.name}`} className="block bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 transition cursor-pointer min-h-[100px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-purple-700 dark:text-purple-300 mb-1">💬 태깅된 게시글</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{politician.taggedCount || 0}개</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">(회원들이 이 정치인에 대해 작성)</div>
                </div>
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          </div>

          <div className="text-base text-gray-500 dark:text-gray-400 text-center">
            클릭하시면 해당 게시글 목록으로 이동합니다
          </div>
        </section>

        {/* [4] 선관위 공식 정보 섹션 */}
        <section id="official" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-32">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">선거관리위원회 공식 정보</h2>

          <div className="space-y-4">
            {/* 학력 */}
            {politician.education && politician.education.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">학력</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-base">
                  {politician.education.map((edu, index) => (
                    <li key={index}>{edu}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 경력 */}
            {politician.career && politician.career.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">경력</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-base">
                  {politician.career.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 당선 이력 */}
            {politician.electionHistory && politician.electionHistory.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">당선 이력</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-base">
                  {politician.electionHistory.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 병역 */}
            {politician.militaryService && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">병역</h3>
                <p className="text-gray-700 dark:text-gray-300 text-base">{politician.militaryService}</p>
              </div>
            )}

            {/* 재산 공개 */}
            {politician.assets && Object.keys(politician.assets).length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">재산 공개</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-base">
                  {politician.assets.total && <li>총 재산: {politician.assets.total}</li>}
                  {politician.assets.real_estate && <li>부동산: {politician.assets.real_estate}</li>}
                  {politician.assets.financial && <li>금융자산: {politician.assets.financial}</li>}
                </ul>
              </div>
            )}

            {/* 세금 체납 */}
            {politician.taxArrears && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">세금 체납</h3>
                <p className="text-gray-700 dark:text-gray-300 text-base">{politician.taxArrears}</p>
              </div>
            )}

            {/* 범죄 경력 */}
            {politician.criminalRecord && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">범죄 경력</h3>
                <p className="text-gray-700 dark:text-gray-300 text-base">{politician.criminalRecord}</p>
              </div>
            )}

            {/* 병역 의혹 */}
            {politician.militaryServiceIssue && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">병역 의혹</h3>
                <p className="text-gray-700 dark:text-gray-300 text-base">{politician.militaryServiceIssue}</p>
              </div>
            )}

            {/* 위장전입 */}
            {politician.residencyFraud && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">위장전입</h3>
                <p className="text-gray-700 dark:text-gray-300 text-base">{politician.residencyFraud}</p>
              </div>
            )}

            {/* 공약 사항 */}
            {politician.pledges && politician.pledges.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">주요 공약</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-base">
                  {politician.pledges.map((pledge, index) => (
                    <li key={index}>{pledge}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 의정 활동 */}
            {politician.legislativeActivity && Object.keys(politician.legislativeActivity).length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">의정 활동</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-base">
                  {politician.legislativeActivity.attendance_rate && <li>출석률: {politician.legislativeActivity.attendance_rate}</li>}
                  {politician.legislativeActivity.bills_proposed && (
                    <li>
                      발의 법안: {politician.legislativeActivity.bills_proposed}건
                      {politician.legislativeActivity.bills_representative && politician.legislativeActivity.bills_co_proposed &&
                        ` (대표 발의 ${politician.legislativeActivity.bills_representative}건, 공동 발의 ${politician.legislativeActivity.bills_co_proposed}건)`
                      }
                    </li>
                  )}
                  {politician.legislativeActivity.bills_passed && <li>가결된 법안: {politician.legislativeActivity.bills_passed}건</li>}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* M3: 관련 정치인 추천 섹션 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">관련 정치인</h2>
            <Link
              href={`/politicians?party=${encodeURIComponent(politician.party)}`}
              className="text-base text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 min-h-[44px] px-2"
            >
              더보기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* 같은 정당 정치인 */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
              같은 정당 ({politician.party})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* 샘플 관련 정치인 카드들 */}
              {[
                { name: '이재명', score: 920, region: '경기 성남' },
                { name: '박지현', score: 890, region: '비례대표' },
                { name: '우원식', score: 875, region: '서울 동작' },
                { name: '추미애', score: 860, region: '서울 광진' },
              ].map((p, idx) => (
                <Link
                  key={idx}
                  href={`/politicians?search=${encodeURIComponent(p.name)}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition min-h-[80px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-base truncate">{p.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{p.region}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-primary-600 dark:text-primary-400">{p.score}점</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 같은 지역 정치인 */}
          <div>
            <h3 className="text-base font-medium text-gray-600 dark:text-gray-400 mb-3">
              같은 지역 ({politician.region})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: '오세훈', party: '국민의힘', score: 885 },
                { name: '박용진', party: '더불어민주당', score: 865 },
              ].map((p, idx) => (
                <Link
                  key={idx}
                  href={`/politicians?search=${encodeURIComponent(p.name)}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition min-h-[80px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-secondary-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-base truncate">{p.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{p.party}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-secondary-600 dark:text-secondary-400">{p.score}점</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* P3BA35: AI 평가 상세 모달 - API categoryScores 사용 */}
      {showAIDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-900">{politician.name} - V24.0 AI 평가 상세</h3>
              <button onClick={() => setShowAIDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* 종합 점수 요약 */}
            <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border border-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">V24.0 종합 점수</div>
                  <div className="text-3xl font-bold text-primary-600">{politician.totalScore || 0}점</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-1">{politician.gradeEmoji || '⬜'}</div>
                  <div className="text-lg font-bold text-gray-900">{politician.gradeName || politician.grade || '미평가'}</div>
                </div>
              </div>
            </div>

            {/* 10개 분야 점수 - API categoryScores 사용 */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">10개 분야별 평가 점수</h4>
              {politician.categoryScores && politician.categoryScores.length > 0 ? (
                <div className="space-y-3">
                  {politician.categoryScores.map((item, index) => (
                    <div key={item.categoryId || index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">
                          {item.categoryId}. {item.categoryName || CATEGORY_NAMES[item.categoryId] || `카테고리 ${item.categoryId}`}
                        </span>
                        <span className="text-sm font-bold text-accent-600">{item.score}점</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(item.score, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>카테고리별 상세 점수 데이터가 아직 없습니다.</p>
                  <p className="text-sm mt-1">AI 평가가 진행되면 표시됩니다.</p>
                </div>
              )}
            </div>

            {/* 평가 기준 안내 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-bold text-gray-700 mb-2">V24.0 평가 기준</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                V24.0 평가 시스템은 10개 카테고리(청렴성, 전문성, 소통능력, 정책능력, 리더십, 책임성, 투명성, 혁신성, 포용성, 효율성)에 대해
                Claude AI가 공개된 자료를 기반으로 객관적으로 평가합니다.
                총점은 1000점 만점이며, 10단계 금속 등급(M~L)으로 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 구매 확인 모달 - 정치인 본인 인증 시스템 구현 후 활성화 */}
      {/* 현재 구매 섹션이 숨김 처리되어 있으므로 이 모달은 열리지 않음 */}
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

      {/* 별점 평가 모달 */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">별점 평가</h3>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setUserRating(0);
                  setHoverRating(0);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4 text-center">
                <span className="font-bold">{politician.name}</span> 정치인에 대한 평가를 남겨주세요
              </p>

              {/* 별점 UI */}
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <svg
                      className="w-12 h-12"
                      fill={star <= (hoverRating || userRating) ? '#F59E0B' : 'none'}
                      stroke={star <= (hoverRating || userRating) ? '#F59E0B' : '#D1D5DB'}
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <span className="text-gray-600">
                  {userRating > 0 ? '★'.repeat(userRating) : '별점 평가를 해주세요'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setUserRating(0);
                  setHoverRating(0);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleRatingSubmit}
                className="flex-1 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition"
              >
                평가 제출
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 액션 버튼 - 데스크탑에서만 표시 (모바일에서는 Hero 섹션의 버튼 사용) */}
      <div className="hidden md:flex fixed bottom-8 right-8 flex-col gap-3 z-40">
        {/* 통합 검색 버튼 */}
        <div className="relative group">
          <button
            onClick={() => window.location.href = '/politicians'}
            className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center border-2 border-primary-300"
            title="통합 검색"
          >
            <svg className="w-5 h-5 text-primary-600 group-hover:text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
              통합 검색
            </div>
          </div>
        </div>

        {/* 별점 평가 버튼 */}
        <div className="relative group">
          <button
            onClick={() => setShowRatingModal(true)}
            className="w-12 h-12 bg-secondary-500 rounded-full shadow-lg hover:shadow-xl hover:bg-secondary-600 transition flex items-center justify-center"
            title="별점 평가"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
          <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
              별점 평가하기
            </div>
          </div>
        </div>

        {/* 관심 정치인 등록 버튼 */}
        <div className="relative group">
          <button
            onClick={handleToggleFavoriteFloating}
            disabled={loadingFavorite}
            className={`w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center ${
              isFavoriteFloating
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            } ${loadingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isFavoriteFloating ? '관심 정치인 취소' : '관심 정치인 등록'}
          >
          {isFavoriteFloating ? (
            <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
        <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
            {isFavoriteFloating ? '관심 정치인 취소' : '관심 정치인 등록'}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
