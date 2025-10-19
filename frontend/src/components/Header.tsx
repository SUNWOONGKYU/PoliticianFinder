'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Header() {
  const { user, signOut, isAuthenticated } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowDropdown(false)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <nav className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* 좌측: 브랜드명 */}
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-purple-600">
              PoliticianFinder
            </Link>
          </div>

          {/* 우측: 네비게이션 메뉴 */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-700 hover:text-purple-600">
              Home
            </Link>
            <Link href="/politicians" className="text-gray-700 hover:text-purple-600">
              정치인 목록
            </Link>
            <Link href="/community" className="text-gray-700 hover:text-purple-600">
              커뮤니티
            </Link>
            <Link href="/search" className="text-gray-700 hover:text-purple-600">
              검색
            </Link>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-xs font-medium text-gray-700 hover:text-purple-600 focus:outline-none"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        width={24}
                        height={24}
                        className="rounded-full"
                        priority={false}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="hidden md:block">
                      {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {user.user_metadata?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        프로필
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        설정
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-purple-600 text-xs">
                  로그인
                </Link>
                <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                  회원가입
                </Link>
              </>
            )}
            <button className="relative p-1 text-gray-700 hover:text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}