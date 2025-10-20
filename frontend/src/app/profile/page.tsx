'use client'

import { useEffect } from 'react'
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-white"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="text-white">
                  <h1 className="text-3xl font-bold">
                    {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                  </h1>
                  <p className="text-blue-100">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Information */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">계정 정보</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">이메일</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">이름</label>
                      <p className="text-gray-900">
                        {user.user_metadata?.full_name || user.user_metadata?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">로그인 방법</label>
                      <p className="text-gray-900">
                        {user.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">가입일</label>
                      <p className="text-gray-900">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">활동 통계</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">0</p>
                      <p className="text-sm text-gray-600">평가한 정치인</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">0</p>
                      <p className="text-sm text-gray-600">관심 정치인</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">0</p>
                      <p className="text-sm text-gray-600">작성한 리뷰</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">0</p>
                      <p className="text-sm text-gray-600">받은 좋아요</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 활동</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">아직 활동 내역이 없습니다.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    정치인을 검색하고 평가를 남겨보세요!
                  </p>
                </div>
              </div>

              {/* Settings */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">설정</h2>
                <div className="space-y-4">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-gray-700">알림 설정</span>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-gray-700">개인정보 설정</span>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-gray-700">계정 관리</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © 2024 정치인 찾기. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  )
}