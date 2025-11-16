'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ProfileFormData {
  nickname: string;
  email: string;
  memberLevel: string;
  bio: string;
  profileImage: File | null;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  level: number;
}

export default function ProfileEditPage() {
  const [formData, setFormData] = useState<ProfileFormData>({
    nickname: '',
    email: '',
    memberLevel: '',
    bio: '',
    profileImage: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/me');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || '사용자 정보를 불러오는데 실패했습니다.');
        }

        const user: UserData = result.data.user;
        setFormData({
          nickname: user.name,
          email: user.email,
          memberLevel: `ML${user.level}`,
          bio: '',
          profileImage: null,
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      nickname: e.target.value,
    }));
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 200);
    setFormData((prev) => ({
      ...prev,
      bio: value,
    }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('파일 크기는 5MB를 초과할 수 없습니다.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));
      showAlert('프로필 사진이 선택되었습니다.');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nickname = formData.nickname.trim();

    if (nickname.length < 2 || nickname.length > 20) {
      showAlert('닉네임은 2~20자 이내로 입력해주세요.');
      return;
    }

    showAlert('프로필이 수정되었습니다!');
  };

  const handleCancel = () => {
    window.history.back();
  };

  const showAlert = (message: string) => {
    setAlert({ message, visible: true });
  };

  const closeAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/login" className="inline-block px-6 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">프로필 수정</h1>
          <p className="text-gray-600 mt-2">회원님의 프로필 정보를 수정할 수 있습니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* 프로필 사진 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              프로필 사진
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              <div>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="profile-image"
                  className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                >
                  사진 변경
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG 파일 (최대 5MB)</p>
              </div>
            </div>
          </div>

          {/* 닉네임 */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-900 mb-2">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nickname"
              value={formData.nickname}
              onChange={handleNicknameChange}
              required
              maxLength={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
            <p className="text-xs text-gray-500 mt-1">2~20자 이내로 입력해주세요.</p>
          </div>

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
          </div>

          {/* 회원 레벨 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              회원 레벨
            </label>
            <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <span className="font-medium text-secondary-600">{formData.memberLevel}</span>
            </div>
          </div>

          {/* 자기소개 */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-900 mb-2">
              자기소개 <span className="text-gray-500">(선택)</span>
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={handleBioChange}
              rows={4}
              maxLength={200}
              placeholder="자기소개를 입력해주세요 (최대 200자)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 resize-none"
            />
            <div className="text-right mt-1">
              <span className="text-sm text-gray-500">
                {formData.bio.length} / 200
              </span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 font-medium"
            >
              저장하기
            </button>
          </div>
        </form>
      </main>

      {/* Alert Modal */}
      {alert.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="mb-6">
              <p className="text-gray-900 text-center whitespace-pre-line">
                {alert.message}
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={closeAlert}
                className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
