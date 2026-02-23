// P3BA28: 관심 등록 버튼 추가
// H13: 정치인 상세 탭 네비게이션 추가
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
// recharts import 제거 - 미사용 Dead Code (2026-01-03)
// 향후 차트 기능 필요 시 동적 import 사용: dynamic(() => import('./components/RatingChart'))
import { Politician } from '@/types/politician';
import FavoriteButton from '@/components/FavoriteButton';
import { LoadingPage } from '@/components/ui/Spinner';
import { useNotification } from '@/components/NotificationProvider';
import { PoliticianAuthModal, getPoliticianSession } from '@/components/PoliticianAuthModal';
import { getCurrentUser } from '@/lib/supabase/client';


// 출마지역 풀네임 변환 (목록 페이지와 동일)
const getFullRegionName = (region: string): string => {
  const regionMap: Record<string, string> = {
    '서울': '서울특별시',
    '경기': '경기도',
    '인천': '인천광역시',
    '부산': '부산광역시',
    '대구': '대구광역시',
    '광주': '광주광역시',
    '대전': '대전광역시',
    '울산': '울산광역시',
    '세종': '세종특별자치시',
    '강원': '강원특별자치도',
    '충북': '충청북도',
    '충남': '충청남도',
    '전북': '전북특별자치도',
    '전남': '전라남도',
    '경북': '경상북도',
    '경남': '경상남도',
    '제주': '제주특별자치도',
  };
  return regionMap[region] || region;
};

// V40: Claude, ChatGPT, Gemini, Grok 4개 AI 평가 시스템
// API에서 동적으로 개별 AI 점수 제공

// H9: 차트 관련 코드 제거 (2026-01-03)
// recharts 미사용으로 CHART_DATA_FULL, ChartPeriod, CHART_PERIODS 삭제
// 향후 차트 기능 추가 시 별도 컴포넌트로 분리하여 dynamic import 적용

// V40 카테고리 이름 매핑 (영문 키 → 한국어)
const CATEGORY_NAMES: Record<string, string> = {
  expertise: '전문성',
  leadership: '리더십',
  vision: '비전',
  integrity: '청렴성',
  ethics: '윤리성',
  accountability: '책임감',
  transparency: '투명성',
  communication: '소통',
  responsiveness: '대응성',
  publicinterest: '공익',
};

export default function PoliticianDetailPage() {
  const params = useParams();
  const politicianId = params?.id as string;
  const { showToast } = useNotification();

  const [politician, setPolitician] = useState<Politician | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // 프로필 이미지 에러 상태 (404 등 이미지 로드 실패 시 기본 이미지로 폴백)
  const [profileImageError, setProfileImageError] = useState(false);

  // 정치인 본인 인증 상태 (상세평가보고서 구매 섹션 표시 여부)
  const [isVerifiedOwner, setIsVerifiedOwner] = useState(false);

  // 현재 로그인한 일반 회원 (Supabase auth)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(false);

  // 정치인 세션 기반 본인 확인 (프로필 수정 버튼 표시 여부)
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // 구매 모달 내 정치인 이메일 인증 서브모달
  const [showPoliticianAuthForPurchase, setShowPoliticianAuthForPurchase] = useState(false);

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
        setError('정치인 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (politicianId) {
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

  // 정치인 세션 기반 본인 확인 (localStorage의 politician_session 확인)
  useEffect(() => {
    const checkOwnProfile = () => {
      const session = getPoliticianSession();
      if (session && session.politician_id === politicianId) {
        // 세션 만료 확인
        const expiresAt = new Date(session.expires_at);
        if (expiresAt > new Date()) {
          setIsOwnProfile(true);
          return;
        }
      }
      setIsOwnProfile(false);
    };

    checkOwnProfile();

    // localStorage 변경 감지 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'politician_session') {
        checkOwnProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [politicianId]);

  const handleReportToggle = useCallback((aiName: string) => {
    setSelectedReports((prev) =>
      prev.includes(aiName) ? prev.filter((name) => name !== aiName) : [...prev, aiName]
    );
  }, []);

  // V40: 4개 AI 통합 평가 - toggleAll 사용 안 함 (legacy)
  const handleToggleAll = useCallback(() => {
    if (selectedReports.length > 0) {
      setSelectedReports([]);
    } else {
      setSelectedReports(['Claude']);
    }
  }, [selectedReports.length]);

  // P3BA35: 상세평가보고서 가격 계산 (AI당 30만원)
  const totalPrice = useMemo(() => {
    return selectedReports.length * 300000;
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

  // 보고서 구매하기 버튼 클릭 → 먼저 인증 확인 후 모달 오픈
  const handleOpenPurchaseModal = async () => {
    setAuthChecking(true);
    const user = await getCurrentUser();
    setCurrentUser(user);
    setAuthChecking(false);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    const type = isOwnProfile ? 'politician' : 'member';
    window.location.href = `/report-purchase?politician_id=${politicianId}&name=${encodeURIComponent(politician?.name || '')}&buyer_type=${type}`;
  };

  // 정치인 이메일 인증 성공 → 구매 모달 다시 열기
  const handlePoliticianAuthForPurchaseSuccess = () => {
    setIsOwnProfile(true);
    setShowPoliticianAuthForPurchase(false);
    setShowPurchaseModal(true);
  };

  const handleRatingSubmit = async () => {
    if (userRating === 0) {
      showToast('별점을 선택해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/ratings/${politicianId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: userRating }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        showToast('평가가 완료되었습니다!', 'success');
        setShowRatingModal(false);
        setUserRating(0);
        // Refresh politician data
        setPolitician(prev => prev ? {
          ...prev,
          userRating: data.averageRating,
          ratingCount: data.ratingCount
        } : null);
      } else {
        // 에러 처리
        if (response.status === 401) {
          showToast('로그인이 필요합니다.', 'error');
          window.location.href = '/auth/login';
        } else {
          showToast(data.error || '평가 제출에 실패했습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('Rating submit error:', error);
      showToast('평가 제출 중 오류가 발생했습니다.', 'error');
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
    if (!politician) return;

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

  if (error || !politician) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">정치인을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-6">{error || '요청하신 정치인 정보가 존재하지 않습니다.'}</p>
            <Link
              href="/politicians"
              className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              정치인 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb - 모바일 접근성을 위해 44px 터치 타겟 */}
        <nav className="mb-6">
          <ol className="flex items-center flex-wrap gap-1 text-sm sm:text-base text-gray-600">
            <li><Link href="/" className="hover:text-primary-600 px-2 py-2 min-h-[44px] inline-flex items-center touch-manipulation active:bg-gray-100 rounded-lg">홈</Link></li>
            <li className="text-gray-400">›</li>
            <li><Link href="/politicians" className="hover:text-primary-600 px-2 py-2 min-h-[44px] inline-flex items-center touch-manipulation active:bg-gray-100 rounded-lg">정치인 목록</Link></li>
            <li className="text-gray-400">›</li>
            <li className="text-gray-900 font-medium px-2 py-2">{politician.name}</li>
          </ol>
        </nav>

        {/* Hero Section - 정치인 메인 색상 (orange) */}
        <section ref={heroRef} className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl shadow-2xl overflow-hidden mb-6 sm:mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative px-4 py-6 sm:px-6 sm:py-8 md:px-12 md:py-12">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={profileImageError || !politician.profileImageUrl || politician.profileImageUrl.trim() === ''
                      ? '/icons/default-profile.svg'
                      : politician.profileImageUrl}
                    alt={politician.name}
                    fill
                    sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 160px"
                    className="object-cover"
                    priority
                    onError={() => setProfileImageError(true)}
                  />
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

              {/* Info Section - 이름, 1줄: 현 직책/정당, 2줄: 출마 신분/출마직종/출마지역/출마지구 */}
              <div className="flex-1 text-center md:text-left text-white">
                {/* 이름 */}
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">{politician.name}</h1>

                {/* 1줄: 현 직책 + 소속 정당 */}
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-2">
                  {politician.title && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium">
                      {politician.title}
                    </span>
                  )}
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-500/80 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium">
                    {politician.party}
                  </span>
                </div>

                {/* 2줄: 출마 신분, 출마직종, 출마지역, 출마지구 */}
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-accent-500/80 backdrop-blur-sm rounded-full text-xs sm:text-sm">
                    {politician.identity}
                  </span>
                  {politician.positionType && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm">
                      {politician.positionType}
                    </span>
                  )}
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs sm:text-sm">
                    {getFullRegionName(politician.region)}
                  </span>
                  {politician.district && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs sm:text-sm">
                      {politician.district}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mx-auto md:mx-0">
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-white text-orange-700 rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
                    aria-label={`${politician.name} 별점 평가`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    별점 평가하기
                  </button>
{/* 정치인 본인 인증된 경우에만 프로필 수정 버튼 표시 */}
                  {isOwnProfile && (
                    <Link
                      href={`/politicians/${politicianId}/edit`}
                      className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 rounded-xl font-bold hover:bg-white/30 hover:scale-105 transition-all flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
                      aria-label={`${politician.name} 프로필 수정`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      프로필 수정
                    </Link>
                  )}
                </div>
              </div>

              {/* Score Cards - 순서: AI 평점 → 등급 → 회원 평가 */}
              <div className="grid grid-cols-3 md:grid-cols-1 gap-2 sm:gap-3 w-full md:w-auto mt-2 sm:mt-0">
                {/* AI Score */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center border border-white/20">
                  <div className="text-xs sm:text-sm text-white/80 mb-0.5 sm:mb-1">V40 종합점수</div>
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">{politician.totalScore}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-white/80 mt-0.5 sm:mt-1">/ 1,000점</div>
                </div>

                {/* Grade Badge - AI 평점 바로 다음 */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center border border-white/20">
                  <div className="text-xs sm:text-sm text-white/80 mb-0.5 sm:mb-1">등급</div>
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight">
                    {politician.grade === 'M' && <><span className="text-base sm:text-lg">🌺</span><span className="hidden sm:inline"> Mugunghwa</span><span className="sm:hidden"> M</span></>}
                    {politician.grade === 'D' && <><span className="text-base sm:text-lg">💎</span><span className="hidden sm:inline"> Diamond</span><span className="sm:hidden"> D</span></>}
                    {politician.grade === 'E' && <><span className="text-base sm:text-lg">💚</span><span className="hidden sm:inline"> Emerald</span><span className="sm:hidden"> E</span></>}
                    {politician.grade === 'P' && <><span className="text-base sm:text-lg">🥇</span><span className="hidden sm:inline"> Platinum</span><span className="sm:hidden"> P</span></>}
                    {politician.grade === 'G' && <><span className="text-base sm:text-lg">🥇</span><span className="hidden sm:inline"> Gold</span><span className="sm:hidden"> G</span></>}
                    {politician.grade === 'S' && <><span className="text-base sm:text-lg">🥈</span><span className="hidden sm:inline"> Silver</span><span className="sm:hidden"> S</span></>}
                    {politician.grade === 'B' && <><span className="text-base sm:text-lg">🥉</span><span className="hidden sm:inline"> Bronze</span><span className="sm:hidden"> B</span></>}
                    {politician.grade === 'I' && <><span className="text-base sm:text-lg">⚫</span><span className="hidden sm:inline"> Iron</span><span className="sm:hidden"> I</span></>}
                    {politician.grade === 'Tn' && <><span className="text-base sm:text-lg">⬜</span><span className="hidden sm:inline"> Tin</span><span className="sm:hidden"> Tn</span></>}
                    {politician.grade === 'L' && <><span className="text-base sm:text-lg">⬛</span><span className="hidden sm:inline"> Lead</span><span className="sm:hidden"> L</span></>}
                    {!politician.grade && '-'}
                  </div>
                </div>

                {/* Member Rating - 항상 별 5개 표시 (채워진/빈 별) */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center border border-white/20">
                  <div className="text-xs sm:text-sm text-white/80 mb-0.5 sm:mb-1">회원 평가</div>
                  <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.round(politician.userRating || 0) ? 'text-yellow-300' : 'text-white/30'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-white/80 mt-0.5 sm:mt-1">{politician.ratingCount || 0}명</div>
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

        {/* [1] 기본 정보 섹션 (상세) - 목록 페이지 순서: 직책, 정당, 출마 신분, 출마직종, 출마지역, 출마지구 */}
        <section id="basic" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 scroll-mt-32">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">상세 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">한자명</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.nameKanji || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">영문명</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.nameEn || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">현 직책</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.title || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">정당</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.party || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">출마 신분</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.identity || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">출마직종</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.positionType || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">출마지역</span>
              <span className="text-gray-900 dark:text-white text-base">{getFullRegionName(politician.region) || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">출마지구</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.district || '-'}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">생년월일</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.birthDate || '-'} {politician.age ? `(${politician.age}세)` : ''}</span>
            </div>
            <div className="flex items-center gap-3 min-h-[44px]">
              <span className="text-gray-600 dark:text-gray-400 font-medium w-24 text-base">성별</span>
              <span className="text-gray-900 dark:text-white text-base">{politician.gender || '-'}</span>
            </div>
          </div>
        </section>

        {/* [2] AI 평가 정보 섹션 */}
        <section id="ai-eval" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 scroll-mt-32">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">V40 AI 평가</h2>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              최종 갱신: {politician.lastUpdated ? new Date(politician.lastUpdated).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            </div>
          </div>

          {/* P3BA35: 시계열 그래프 - 준비 중 안내 (API 시계열 데이터 미지원) */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 md:p-6">
              <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white mb-4">V40 점수 추이</h3>
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium mb-2">점수 추이 차트 준비 중</p>
                <p className="text-sm">V40 기반 4개 AI 점수 변화 추이 차트가 곧 제공될 예정입니다.</p>
              </div>
            </div>
          </div>

          {/* AI 평가 점수 표시 - 종합평점 + 4개 AI + 등급 카드 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
            {/* 종합 평점 */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border-2 border-primary-200 dark:border-primary-600">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg">📊</span>
                <span className="font-medium text-gray-900 dark:text-white text-xs">V40 종합</span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{politician.totalScore || 0}</span>
              </div>
            </div>

            {/* Claude AI */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
              <div className="flex flex-col items-center gap-0.5">
                <img src="https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png" alt="Claude" className="h-5 w-5 object-contain rounded" />
                <span className="font-medium text-gray-900 dark:text-white text-xs">Claude</span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{(politician as any).claudeScore || 0}</span>
              </div>
            </div>

            {/* ChatGPT */}
            <div className="bg-gradient-to-br from-slate-50 to-green-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
              <div className="flex flex-col items-center gap-0.5">
                <img src="https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg" alt="ChatGPT" className="h-5 w-5 object-contain" />
                <span className="font-medium text-gray-900 dark:text-white text-xs">ChatGPT</span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{(politician as any).chatgptScore || 0}</span>
              </div>
            </div>

            {/* Gemini */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
              <div className="flex flex-col items-center gap-0.5">
                <img src="https://cdn.simpleicons.org/googlegemini" alt="Gemini" className="h-5 w-5 object-contain" />
                <span className="font-medium text-gray-900 dark:text-white text-xs">Gemini</span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{(politician as any).geminiScore || 0}</span>
              </div>
            </div>

            {/* Grok */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
              <div className="flex flex-col items-center gap-0.5">
                <img src="https://cdn.simpleicons.org/x/000000" alt="Grok" className="h-4 w-4 max-h-4 max-w-4 object-contain dark:invert" />
                <span className="font-medium text-gray-900 dark:text-white text-xs">Grok</span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{(politician as any).grokScore || 0}</span>
              </div>
            </div>

            {/* 등급 카드 */}
            <div className="bg-gradient-to-br from-secondary-50 to-amber-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-secondary-100 dark:border-gray-600">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg">{politician.gradeEmoji || '⬜'}</span>
                <span className="font-medium text-gray-900 dark:text-white text-xs">등급</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {politician.grade || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 카테고리별 상세 보기 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => openAIDetailModal('Claude')}
              className="w-full px-4 py-3 bg-primary-500 text-white text-base font-medium rounded-lg hover:bg-primary-600 transition min-h-[44px]"
            >
              🔍 V40 카테고리별 상세 평가 보기
            </button>
          </div>

          {/* 상세평가보고서 구매 섹션 - 모든 사용자에게 표시 */}
          <div className="bg-slate-50 rounded-lg p-6 border-2 border-slate-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📊 AI 통합 평가 보고서</h3>
            <p className="text-base text-gray-900 mb-3">
              <strong className="text-lg">4개 AI의 상세 평가 내역이 궁금하신가요?</strong><br/>
              Claude, ChatGPT, Gemini, Grok 4개 AI의 통합 평가 보고서를 PDF로 제공해드립니다.
            </p>

            {/* 보고서 목차 */}
            <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-800 mb-2">📋 보고서 구성</p>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>정치인 프로필</li>
                <li>종합 점수 (AI별 최종 점수, 10개 카테고리 점수, AI 평가 편차 분석)</li>
                <li>카테고리별 상세 분석 (10개 카테고리 x AI별 점수 + 주요 근거)</li>
                <li>경쟁자 비교</li>
                <li>점수 구조 분석</li>
                <li>평가 방법론 및 한계</li>
                <li>등급 기준표</li>
              </ol>
            </div>

            {/* AI 기반 정치인 평가점수 산출 프로세스 */}
            <div className="mt-4 mb-4 border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-800 px-4 py-2.5">
                <p className="text-sm font-bold text-white">📊 AI 기반 정치인 평가점수 산출 프로세스</p>
                <p className="text-xs text-gray-300 mt-0.5">데이터 수집 → 4개 AI 독립 평가 → 점수 산출 → 등급 판정</p>
              </div>
              <div className="bg-gray-50 p-4 space-y-4">
                {/* STEP 1+2: 수집 & 평가 */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex items-center mb-1.5">
                      <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded mr-2">STEP 1</span>
                      <span className="font-bold text-gray-900">데이터 수집</span>
                    </div>
                    <div className="space-y-1">
                      <div className="bg-white rounded p-2 border border-gray-100">
                        <p className="font-semibold text-gray-800">OFFICIAL <span className="font-normal text-gray-500 text-xs">(최근 4년)</span></p>
                        <p className="text-gray-500">공직 수행 기록·공식 발표·정책자료 등 검증된 공식 활동</p>
                      </div>
                      <div className="bg-white rounded p-2 border border-gray-100">
                        <p className="font-semibold text-gray-800">PUBLIC <span className="font-normal text-gray-500 text-xs">(최근 2년)</span></p>
                        <p className="text-gray-500">뉴스 보도·인터뷰·SNS 발언 등 공개된 모든 활동 기록</p>
                      </div>
                    </div>
                    <div className="mt-1.5 bg-gray-100 rounded px-2 py-1 text-gray-800 text-center font-medium">
                      1인당 1,000~1,200건
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-1.5">
                      <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded mr-2">STEP 2</span>
                      <span className="font-bold text-gray-900">4개 AI 독립 평가</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { name: 'Claude', color: 'bg-gray-50 border-gray-200 text-gray-800' },
                        { name: 'ChatGPT', color: 'bg-gray-50 border-gray-200 text-gray-800' },
                        { name: 'Gemini', color: 'bg-gray-50 border-gray-200 text-gray-800' },
                        { name: 'Grok', color: 'bg-gray-50 border-gray-200 text-gray-800' },
                      ].map((ai) => (
                        <div key={ai.name} className={`rounded p-1.5 border ${ai.color} font-semibold text-center text-xs`}>
                          🤖 {ai.name}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 bg-gray-100 rounded px-2 py-1 text-gray-800 text-center font-medium">
                      총 4,000~4,800건 평가
                    </div>
                  </div>
                </div>
                {/* STEP 3+4: 등급 & 공식 */}
                <div>
                  <div className="flex items-center mb-1.5">
                    <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded mr-2">STEP 3</span>
                    <span className="text-xs font-bold text-gray-900">8단계 등급 평가 → 점수 산출</span>
                  </div>
                  <div className="grid grid-cols-8 gap-0.5 text-xs text-center mb-2">
                    {[
                      { r: '+4', color: 'bg-gray-700 text-white' },
                      { r: '+3', color: 'bg-gray-500 text-white' },
                      { r: '+2', color: 'bg-gray-200 text-gray-800' },
                      { r: '+1', color: 'bg-gray-100 text-gray-700' },
                      { r: '−1', color: 'bg-gray-100 text-gray-700' },
                      { r: '−2', color: 'bg-gray-200 text-gray-800' },
                      { r: '−3', color: 'bg-gray-500 text-white' },
                      { r: '−4', color: 'bg-gray-700 text-white' },
                    ].map((g) => (
                      <div key={g.r} className={`rounded py-1 font-bold ${g.color}`}>{g.r}</div>
                    ))}
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-center font-mono text-gray-900 font-bold text-sm">
                    카테고리 점수 = (6.0 + avg_score × 0.5) × 10
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">※ 점수는 등급에 연동 자동 확정 — Rating × 2 = Score (인위 조정 없음)</p>
                </div>
                {/* 카테고리 분류 */}
                <div className="text-xs">
                  <div className="flex items-center mb-1.5">
                    <span className="border border-gray-400 text-gray-700 text-xs font-bold px-2 py-0.5 rounded mr-2">카테고리 분류</span>
                    <span className="font-bold text-gray-900">수집 단계부터 적용되는 10개 평가 카테고리</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { icon: '📚', name: '전문성', desc: '정책·입법 전문 능력' },
                      { icon: '🎯', name: '리더십', desc: '방향 제시·결정력' },
                      { icon: '🔭', name: '비전', desc: '미래 방향성·청사진' },
                      { icon: '💎', name: '청렴성', desc: '부정부패·도덕성' },
                      { icon: '⚖️', name: '윤리성', desc: '공인으로서의 윤리' },
                      { icon: '✅', name: '책임감', desc: '공약 이행·결과 책임' },
                      { icon: '🔍', name: '투명성', desc: '정보 공개·활동 공개' },
                      { icon: '💬', name: '소통능력', desc: '국민·언론 소통' },
                      { icon: '⚡', name: '대응성', desc: '민원·현안 대응 속도' },
                      { icon: '🌍', name: '공익성', desc: '공공이익 우선 여부' },
                    ].map((cat) => (
                      <div key={cat.name} className="bg-white rounded border border-gray-100 px-2 py-1.5 flex items-center gap-1.5">
                        <span>{cat.icon}</span>
                        <div>
                          <span className="font-semibold text-gray-900">{cat.name}</span>
                          <span className="text-gray-500 ml-1">{cat.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* STEP 4: 최종 등급 */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <div className="flex items-center mb-1.5">
                      <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded mr-2">STEP 4</span>
                      <span className="font-bold text-gray-900">최종 등급 도출 (200~1,000점)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      {[
                        { grade: 'M', range: '950~', color: 'bg-gray-800 text-white' },
                        { grade: 'P+', range: '900~', color: 'bg-gray-700 text-white' },
                        { grade: 'P', range: '850~', color: 'bg-gray-600 text-white' },
                        { grade: 'P−', range: '800~', color: 'bg-gray-500 text-white' },
                        { grade: 'E+', range: '750~', color: 'bg-gray-400 text-white' },
                        { grade: 'E', range: '700~', color: 'bg-gray-300 text-gray-900' },
                        { grade: 'E−', range: '650~', color: 'bg-gray-300 text-gray-800' },
                        { grade: 'C', range: '550~', color: 'bg-gray-200 text-gray-800' },
                        { grade: 'D', range: '400~', color: 'bg-gray-200 text-gray-700' },
                        { grade: 'L', range: '~399', color: 'bg-gray-100 text-gray-700' },
                      ].map((g) => (
                        <div key={g.grade} className={`rounded px-1.5 py-1 ${g.color} font-bold`}>
                          {g.grade} <span className="font-normal text-xs opacity-80">{g.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenPurchaseModal}
              disabled={authChecking}
              className="w-full py-3 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 active:bg-primary-700 transition text-base mt-2 disabled:opacity-60"
            >
              {authChecking ? '확인 중...' : '보고서 구매하기'}
            </button>
          </div>
        </section>

        {/* [3] 커뮤니티 활동 정보 섹션 - 확장 버전 */}
        <section id="community" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 scroll-mt-32">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">커뮤니티</h2>

          {/* 통계 카드 - 배경만 중립색 적용 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href={`/community?filter=politician&author=${politician.name}`} className="block bg-slate-50 dark:bg-slate-900/20 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition">
              <div className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">작성한 글</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{politician.postCount || 0}</div>
            </Link>
            <Link href={`/community?filter=general&tagged=${politician.name}`} className="block bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 hover:border-purple-400 transition">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">태깅된 글</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{politician.taggedCount || 0}</div>
            </Link>
          </div>

          {/* 의견 작성 폼 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">💬 {politician.name} {politician.region || ''} {politician.positionType || politician.title || ''} {politician.identity || ''}에게 의견 남기기</h3>
            <textarea
              placeholder={`${politician.name} ${politician.region || ''} ${politician.positionType || politician.title || ''} ${politician.identity || ''}에 대한 의견을 남겨주세요...`}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[15px] text-gray-900 dark:text-white bg-white dark:bg-gray-800 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition min-h-[44px] touch-manipulation">
                의견 등록
              </button>
            </div>
          </div>

          {/* 최근 의견/댓글 목록 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">최근 의견</h3>
              <Link href={`/community?tagged=${politician.name}`} className="text-sm text-primary-600 hover:underline min-h-[44px] flex items-center px-2">
                전체보기 →
              </Link>
            </div>

            <div className="space-y-4">
              {/* 샘플 의견 1 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold text-secondary-600">시민참여자</span>
                  <span className="mx-2">·</span>
                  <span>ML3</span>
                  <span className="mx-2">·</span>
                  <span>2025.01.15</span>
                </div>
                <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed">
                  {politician.name} 의원님의 최근 활동에 대해 긍정적으로 평가합니다. 지역 발전을 위해 노력하시는 모습이 인상적입니다.
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <button className="flex items-center gap-1 hover:text-red-500 min-h-[44px] px-2 -mx-2 touch-manipulation">
                    <span>👍</span> <span>12</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-gray-700 min-h-[44px] px-2 touch-manipulation">
                    <span>👎</span> <span>2</span>
                  </button>
                  <button className="hover:text-primary-600 min-h-[44px] px-2 touch-manipulation">답글</button>
                </div>
              </div>

              {/* 샘플 의견 2 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold text-secondary-600">정책분석가</span>
                  <span className="mx-2">·</span>
                  <span>ML5</span>
                  <span className="mx-2">·</span>
                  <span>2025.01.14</span>
                </div>
                <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed">
                  교통 정책에 대한 공약 이행률이 궁금합니다. 구체적인 진행 상황을 알 수 있을까요?
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <button className="flex items-center gap-1 hover:text-red-500 min-h-[44px] px-2 -mx-2 touch-manipulation">
                    <span>👍</span> <span>8</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-gray-700 min-h-[44px] px-2 touch-manipulation">
                    <span>👎</span> <span>0</span>
                  </button>
                  <button className="hover:text-primary-600 min-h-[44px] px-2 touch-manipulation">답글</button>
                </div>
              </div>

              {/* 샘플 의견 3 - 정치인 답변 */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-l-4 border-primary-500">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold text-primary-600">🏛️ {politician.name}</span>
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">정치인</span>
                  <span className="mx-2">·</span>
                  <span>2025.01.14</span>
                </div>
                <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed">
                  관심 가져주셔서 감사합니다. 교통 정책 관련하여 현재 70% 이상 진행 중이며, 다음 달 중으로 구체적인 성과 보고서를 공개할 예정입니다.
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <button className="flex items-center gap-1 hover:text-red-500 min-h-[44px] px-2 -mx-2 touch-manipulation">
                    <span>👍</span> <span>45</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-gray-700 min-h-[44px] px-2 touch-manipulation">
                    <span>👎</span> <span>3</span>
                  </button>
                  <button className="hover:text-primary-600 min-h-[44px] px-2 touch-manipulation">답글</button>
                </div>
              </div>
            </div>

            {/* 더보기 버튼 */}
            <div className="text-center mt-4">
              <Link
                href={`/community?tagged=${politician.name}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition min-h-[44px] touch-manipulation"
              >
                더 많은 의견 보기
              </Link>
            </div>
          </div>

          {/* 관련 게시글 미리보기 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">관련 게시글</h3>
              <Link href={`/community?search=${politician.name}`} className="text-sm text-primary-600 hover:underline min-h-[44px] flex items-center px-2">
                전체보기 →
              </Link>
            </div>

            <div className="space-y-2">
              {/* 샘플 게시글 1 */}
              <Link href="/community/posts/1" className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
                      [{politician.name} 의원 관련] 지역 발전 정책 분석
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      시민참여자 · 조회 156 · 👍 23
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">1일 전</span>
                </div>
              </Link>

              {/* 샘플 게시글 2 */}
              <Link href="/community/posts/2" className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
                      {politician.party} 소속 의원들 활동 비교
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      정책분석가 · 조회 234 · 👍 45
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">3일 전</span>
                </div>
              </Link>

              {/* 샘플 게시글 3 */}
              <Link href="/community/posts/3" className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
                      {politician.region} 지역 현안에 대한 의견
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      지역주민 · 조회 89 · 👍 12
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">5일 전</span>
                </div>
              </Link>
            </div>
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
      </div>

      {/* V40 AI 평가 상세 모달 */}
      {showAIDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{politician.name} - V40 카테고리별 AI 평가</h3>
              <button
                onClick={() => setShowAIDetailModal(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* 종합 점수 요약 */}
            <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border border-primary-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">V40 종합 점수</div>
                  <div className="text-3xl font-bold text-primary-600">{politician.totalScore || 0}점</div>
                  <div className="text-xs text-gray-500 mt-1">/ 1,000점 만점</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-1">{politician.gradeEmoji || '⬜'}</div>
                  <div className="text-lg font-bold text-gray-900">{politician.gradeName || politician.grade || '미평가'}</div>
                </div>
                {/* AI별 종합 점수 */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { name: 'Claude', score: (politician as any).claudeScore },
                    { name: 'ChatGPT', score: (politician as any).chatgptScore },
                    { name: 'Gemini', score: (politician as any).geminiScore },
                    { name: 'Grok', score: (politician as any).grokScore },
                  ].map(ai => (
                    <div key={ai.name} className="text-center bg-white rounded-lg p-2 border border-gray-100">
                      <div className="text-gray-500 font-medium">{ai.name}</div>
                      <div className="text-base font-bold text-primary-600">{ai.score || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 10개 분야 점수 - V40 카테고리별 4AI 점수 */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">10개 분야별 AI 평가 점수</h4>
              <p className="text-xs text-gray-500 mb-4">각 분야별 4개 AI(Claude·ChatGPT·Gemini·Grok)의 평가 점수 (100점 기준)</p>
              {politician.categoryScores && politician.categoryScores.length > 0 ? (
                <div className="space-y-3">
                  {(politician.categoryScores as any[]).map((item: any, index: number) => (
                    <div key={item.categoryKey || index} className="bg-gray-50 rounded-lg p-3">
                      {/* 카테고리명 + 평균 점수 */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-800 text-sm">
                          {CATEGORY_NAMES[item.categoryKey] || item.categoryKey}
                        </span>
                        <span className="text-sm font-bold text-primary-600">{item.score}점</span>
                      </div>
                      {/* 평균 점수 바 */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(item.score, 100)}%` }}
                        ></div>
                      </div>
                      {/* AI별 개별 점수 */}
                      {item.aiScores && (
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          {[
                            { ai: 'Claude', score: item.aiScores.Claude },
                            { ai: 'ChatGPT', score: item.aiScores.ChatGPT },
                            { ai: 'Gemini', score: item.aiScores.Gemini },
                            { ai: 'Grok', score: item.aiScores.Grok },
                          ].map(({ ai, score }) => (
                            <div key={ai} className="text-center bg-white rounded p-1 border border-gray-100">
                              <div className="text-gray-400">{ai}</div>
                              <div className="font-semibold text-gray-700">{score || 0}</div>
                            </div>
                          ))}
                        </div>
                      )}
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
              <h4 className="text-sm font-bold text-gray-700 mb-2">V40 평가 기준</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                V40 평가 시스템은 10개 분야(전문성·리더십·비전·청렴성·윤리성·책임감·투명성·소통·대응성·공익)에 대해
                Claude, ChatGPT, Gemini, Grok 4개 AI가 공개된 자료를 기반으로 독립적으로 평가합니다.
                총점은 1,000점 만점이며, 10단계 등급(M~L)으로 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 구매 확인 모달 - 정치인 본인 인증 시스템 구현 후 활성화 */}
      {/* 현재 구매 섹션이 숨김 처리되어 있으므로 이 모달은 열리지 않음 */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl">

            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5 border-b pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">정치인 AI 상세평가보고서</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* ── STEP 1: 비로그인 상태 ── */}
            {!currentUser && !isOwnProfile ? (
              <div>
                <div className="text-center mb-5">
                  <div className="text-4xl mb-3">🔒</div>
                  <p className="text-base font-semibold text-gray-800 mb-1">구매하려면 로그인이 필요합니다</p>
                  <p className="text-sm text-gray-500">일반 회원은 로그인 후, 정치인 본인은 이메일 인증 후 구매할 수 있습니다.</p>
                </div>
                {/* 일반 회원 로그인/가입 */}
                <div className="space-y-2.5 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">일반 회원</p>
                  <Link
                    href={`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`}
                    className="flex items-center justify-center w-full py-3 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 transition"
                    onClick={() => setShowPurchaseModal(false)}
                  >
                    로그인하기
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center w-full py-3 border border-primary-400 text-primary-600 font-bold rounded-lg hover:bg-primary-50 transition"
                    onClick={() => setShowPurchaseModal(false)}
                  >
                    회원가입하기
                  </Link>
                </div>

                {/* 구분선 */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">또는</span>
                  </div>
                </div>

                {/* 정치인 이메일 인증 */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">정치인 본인 구매</p>
                  <button
                    onClick={() => {
                      setShowPurchaseModal(false);
                      setShowPoliticianAuthForPurchase(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-blue-400 text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    정치인 이메일 인증하기
                  </button>
                  <p className="text-xs text-center text-gray-400">등록된 이메일로 본인 인증 후 구매 가능</p>
                </div>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  닫기
                </button>
              </div>

            ) : (
              /* ── STEP 2: 로그인 완료 → 가격 + 안내사항 표시 ── */
              <>
                {/* 로그인 상태 표시 */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-700 font-medium">
                    {isOwnProfile ? '정치인 본인 인증 완료' : `로그인 완료 (${currentUser?.email || '회원'})`}
                  </span>
                </div>

                {/* 가격 */}
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-4 text-center">
                  <div className="text-sm text-gray-500 mb-1">보고서 가격</div>
                  <div className="text-3xl font-extrabold text-primary-600">₩2,000,000</div>
                  <div className="text-sm text-gray-500">(부가세 별도)</div>
                  <div className="mt-1.5 text-xs text-green-600 font-medium">* 구매 회차별 할인 적용</div>
                </div>

                {/* 안내사항 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                  <h4 className="font-bold text-amber-800 mb-2.5 flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    안내사항
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                      <span><strong>구매 대상:</strong> 정치인 본인 또는 회원 누구나 구매할 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                      <span><strong>할인 정책:</strong> 구매 회차별 10만원씩 할인 (최소 100만원, 부가세 별도)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-gray-500 text-xs">* 환불 불가</span>
                    </li>
                  </ul>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 px-4 py-3 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition touch-manipulation"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmPurchase}
                    className="flex-1 px-4 py-3 min-h-[44px] bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600 active:bg-primary-700 transition touch-manipulation"
                  >
                    구매 진행하기
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* 정치인 이메일 인증 모달 (구매 플로우) */}
      <PoliticianAuthModal
        isOpen={showPoliticianAuthForPurchase}
        onClose={() => setShowPoliticianAuthForPurchase(false)}
        onSuccess={(session, politician) => {
          handlePoliticianAuthForPurchaseSuccess();
        }}
      />

      {/* 별점 평가 모달 */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">별점 평가</h3>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setUserRating(0);
                  setHoverRating(0);
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition touch-manipulation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4 text-center text-base">
                <span className="font-bold">{politician.name}</span> 정치인에 대한 평가를 남겨주세요
              </p>

              {/* 별점 UI - 48px 터치 타겟 */}
              <div className="flex justify-center gap-1 sm:gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 touch-manipulation"
                  >
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12"
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
                <span className="text-gray-600 text-base">
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
                className="flex-1 px-4 py-3 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition touch-manipulation"
              >
                취소
              </button>
              <button
                onClick={handleRatingSubmit}
                className="flex-1 px-4 py-3 min-h-[44px] bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 active:bg-secondary-800 transition touch-manipulation"
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
