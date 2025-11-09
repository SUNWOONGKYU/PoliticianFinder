// Task ID: P1F6
// 작업명: 정치인 프로필 페이지
// 작업 설명: 정치인의 상세 프로필 정보를 표시하는 페이지 (인증 배지, 팔로우 버튼, 기본정보, 경력, 공약, 평가 탭 등)

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  UserPlus,
  UserCheck,
  MapPin,
  Calendar,
  Award,
  Target,
  TrendingUp,
  Users,
  Heart,
  Share2,
  ExternalLink
} from 'lucide-react'

// Types
interface PoliticianProfile {
  id: number
  name: string
  profile_image_url: string | null
  party: string
  position: string
  region: string
  is_verified: boolean
  bio: string | null
  birth_date: string | null
  education: string[]
  career: CareerItem[]
  pledges: Pledge[]
  ai_score: number | null
  followers_count: number
  ratings_count: number
  avg_rating: number
  website_url: string | null
}

interface CareerItem {
  period: string
  title: string
  description?: string
}

interface Pledge {
  id: number
  title: string
  description: string
  category: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

interface Stats {
  followers: number
  ratings: number
  avgScore: number
  aiScore: number
}

type TabType = 'info' | 'career' | 'pledges' | 'ratings'

export default function PoliticianProfilePage() {
  const params = useParams()
  const router = useRouter()
  const politicianId = parseInt(params.id as string)

  const [politician, setPolitician] = useState<PoliticianProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [followLoading, setFollowLoading] = useState(false)

  // Fetch politician profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        // TODO: Replace with actual API endpoint
        const response = await fetch(`/api/politicians/${politicianId}/profile`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('정치인을 찾을 수 없습니다.')
          }
          throw new Error('프로필 정보를 불러오는데 실패했습니다.')
        }

        const data = await response.json()
        setPolitician(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (politicianId && !isNaN(politicianId)) {
      fetchProfile()
    } else {
      setError('잘못된 정치인 ID입니다.')
      setLoading(false)
    }
  }, [politicianId])

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true)

      // TODO: Replace with actual API endpoint
      const response = await fetch(`/api/politicians/${politicianId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        // Update follower count
        if (politician) {
          setPolitician({
            ...politician,
            followers_count: politician.followers_count + (isFollowing ? -1 : 1)
          })
        }
      }
    } catch (err) {
      console.error('Follow toggle failed:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  // Handle share
  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${politician?.name} - PoliticianFinder`,
          text: `${politician?.name} 정치인의 프로필을 확인해보세요`,
          url: url,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url)
      alert('링크가 클립보드에 복사되었습니다.')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !politician) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || '정치인을 찾을 수 없습니다'}
          </h1>
          <p className="text-gray-600 mb-6">
            요청하신 정치인 정보를 찾을 수 없습니다.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#064E3B] text-white rounded-lg hover:bg-[#065F46] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // Helper function for pledge status badge
  const getPledgeStatusBadge = (status: Pledge['status']) => {
    const statusMap = {
      pending: { label: '진행 예정', className: 'bg-gray-100 text-gray-700' },
      in_progress: { label: '진행 중', className: 'bg-blue-100 text-blue-700' },
      completed: { label: '완료', className: 'bg-green-100 text-green-700' },
      failed: { label: '미달성', className: 'bg-red-100 text-red-700' },
    }
    const { label, className } = statusMap[status]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
        {label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">뒤로</span>
          </button>
        </div>
      </div>

      
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 overflow-hidden">
                {politician.profile_image_url ? (
                  <img
                    src={politician.profile_image_url}
                    alt={politician.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#064E3B] to-[#065F46] text-white text-3xl md:text-4xl font-bold">
                    {politician.name.charAt(0)}
                  </div>
                )}
              </div>
              {politician.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                  <CheckCircle className="w-6 h-6 text-[#064E3B]" aria-label="인증됨" />
                </div>
              )}
            </div>

            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {politician.name}
                    </h1>
                    {politician.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#064E3B] text-white text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        인증
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-2">{politician.position}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {politician.party}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {politician.region}
                    </span>
                  </div>
                </div>

                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-[#064E3B] text-white hover:bg-[#065F46]'
                    } disabled:opacity-50`}
                    aria-label={isFollowing ? '팔로우 취소' : '팔로우'}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">팔로잉</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">팔로우</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    aria-label="공유하기"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              
              {politician.bio && (
                <p className="text-gray-700 mb-4 leading-relaxed">{politician.bio}</p>
              )}

              
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    팔로워 <strong className="text-gray-900 ml-1">{politician.followers_count.toLocaleString()}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    평가 <strong className="text-gray-900 ml-1">{politician.ratings_count.toLocaleString()}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    평균 <strong className="text-gray-900 ml-1">{politician.avg_rating.toFixed(1)}</strong>
                  </span>
                </div>
                {politician.ai_score !== null && (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      AI 점수 <strong className="text-[#064E3B] ml-1">{politician.ai_score.toFixed(0)}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto" role="tablist">
            {[
              { id: 'info', label: '기본정보', icon: Users },
              { id: 'career', label: '경력', icon: Calendar },
              { id: 'pledges', label: '공약', icon: Target },
              { id: 'ratings', label: '평가', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#064E3B] text-[#064E3B] font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {politician.birth_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">생년월일</dt>
                    <dd className="text-base text-gray-900">{politician.birth_date}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">소속 정당</dt>
                  <dd className="text-base text-gray-900">{politician.party}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">지역구</dt>
                  <dd className="text-base text-gray-900">{politician.region}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">직책</dt>
                  <dd className="text-base text-gray-900">{politician.position}</dd>
                </div>
              </dl>
            </div>

            {politician.education && politician.education.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">학력</h2>
                <ul className="space-y-2">
                  {politician.education.map((edu, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[#064E3B] mt-1.5">•</span>
                      <span className="text-gray-700">{edu}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {politician.website_url && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">공식 웹사이트</h2>
                <a
                  href={politician.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#064E3B] hover:underline"
                >
                  {politician.website_url}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        
        {activeTab === 'career' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">주요 경력</h2>
            {politician.career && politician.career.length > 0 ? (
              <div className="space-y-6">
                {politician.career.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#064E3B]"></div>
                      {index < politician.career.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-sm text-gray-500 mb-1">{item.period}</p>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">등록된 경력이 없습니다.</p>
            )}
          </div>
        )}

        
        {activeTab === 'pledges' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">주요 공약</h2>
              <div className="text-sm text-gray-500">
                총 {politician.pledges?.length || 0}개
              </div>
            </div>
            {politician.pledges && politician.pledges.length > 0 ? (
              <div className="space-y-4">
                {politician.pledges.map((pledge) => (
                  <div key={pledge.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {pledge.title}
                      </h3>
                      {getPledgeStatusBadge(pledge.status)}
                    </div>
                    <p className="text-gray-600 mb-3">{pledge.description}</p>
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {pledge.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">등록된 공약이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        
        {activeTab === 'ratings' && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">평가 기능</h3>
            <p className="text-gray-500 mb-6">
              상세한 평가 정보는 메인 상세 페이지에서 확인하실 수 있습니다.
            </p>
            <button
              onClick={() => router.push(`/politicians/${politicianId}`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#064E3B] text-white rounded-lg hover:bg-[#065F46] transition-colors"
            >
              평가 보러가기
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
