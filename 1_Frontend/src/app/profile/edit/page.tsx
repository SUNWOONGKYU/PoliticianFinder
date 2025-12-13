'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { CONSTITUENCIES } from '@/constants/constituencies';

interface ProfileFormData {
  nickname: string;
  email: string;
  memberLevel: string;
  bio: string;
  profileImage: File | null;
  preferredRegion: string;  // 광역 (예: "서울", "경기")
  preferredDistrict: string;  // 선거구 (예: "강남구 갑", "수원시 갑")
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  level: number;
  bio?: string;
  preferred_district?: string;
  profile_image_url?: string;
}

export default function ProfileEditPage() {
  const [formData, setFormData] = useState<ProfileFormData>({
    nickname: '',
    email: '',
    memberLevel: '',
    bio: '',
    profileImage: null,
    preferredRegion: '',
    preferredDistrict: '',
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  // 광역 목록
  const regionList = useMemo(() => {
    return CONSTITUENCIES.map(c => c.metropolitanArea);
  }, []);

  // 선택한 광역에 따른 선거구 목록
  const districtList = useMemo(() => {
    if (!formData.preferredRegion) return [];
    const constituency = CONSTITUENCIES.find(c => c.metropolitanArea === formData.preferredRegion);
    return constituency ? constituency.districts : [];
  }, [formData.preferredRegion]);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // 인증 정보와 프로필 정보 동시 조회
        const [authResponse, profileResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/profile')
        ]);

        const authResult = await authResponse.json();
        const profileResult = await profileResponse.json();

        if (!authResponse.ok || !authResult.success) {
          throw new Error(authResult.error?.message || '사용자 정보를 불러오는데 실패했습니다.');
        }

        // /api/auth/me 응답: { success, user, profile }
        const user = authResult.user;
        const authProfile = authResult.profile;
        const profile = profileResult.success ? profileResult.data : authProfile;

        // 마이페이지와 동일한 방식으로 데이터 접근
        const userName = authProfile?.name || authProfile?.nickname || user?.email || '';
        const userLevel = parseInt((authProfile?.activity_level || 'ML1').replace('ML', '')) || 1;

        // 저장된 지역 데이터 파싱 (형식: "광역|선거구" 또는 기존 형식)
        let savedRegion = '';
        let savedDistrict = '';
        const savedLocation = profile?.preferred_district || '';

        if (savedLocation.includes('|')) {
          // 새 형식: "서울|강남구 갑"
          const [region, district] = savedLocation.split('|');
          savedRegion = region;
          savedDistrict = district;
        } else if (savedLocation) {
          // 기존 형식이거나 광역만 저장된 경우 - 광역으로 간주
          const foundConstituency = CONSTITUENCIES.find(c =>
            c.metropolitanArea === savedLocation ||
            c.fullName === savedLocation ||
            c.districts.includes(savedLocation)
          );
          if (foundConstituency) {
            if (foundConstituency.districts.includes(savedLocation)) {
              // 선거구가 저장된 경우 해당 광역 찾기
              savedRegion = foundConstituency.metropolitanArea;
              savedDistrict = savedLocation;
            } else {
              // 광역만 저장된 경우
              savedRegion = foundConstituency.metropolitanArea;
            }
          }
        }

        setFormData({
          nickname: userName,
          email: user?.email || '',
          memberLevel: `ML${userLevel}`,
          bio: profile?.bio || '',
          profileImage: null,
          preferredRegion: savedRegion,
          preferredDistrict: savedDistrict,
        });

        if (profile?.profile_image_url) {
          setProfileImageUrl(profile.profile_image_url);
        }
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

  // 광역 변경 시 선거구 초기화
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      preferredRegion: e.target.value,
      preferredDistrict: '',  // 광역 변경 시 선거구 초기화
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      preferredDistrict: e.target.value,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nickname = formData.nickname.trim();

    if (nickname.length < 2 || nickname.length > 20) {
      showAlert('닉네임은 2~20자 이내로 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      // 프로필 데이터 업데이트
      const updateData: Record<string, string> = {
        nickname: nickname,
      };

      if (formData.bio) {
        updateData.bio = formData.bio;
      }

      // 광역|선거구 형식으로 저장 (예: "서울|강남구 갑")
      if (formData.preferredRegion && formData.preferredDistrict) {
        updateData.preferred_district = `${formData.preferredRegion}|${formData.preferredDistrict}`;
      } else if (formData.preferredRegion) {
        // 광역만 선택한 경우
        updateData.preferred_district = formData.preferredRegion;
      }

      // 프로필 사진 업로드
      if (formData.profileImage) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.profileImage);
        imageFormData.append('uploadType', 'avatar');

        const uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          body: imageFormData,
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResponse.ok && uploadResult.success && uploadResult.images?.original) {
          updateData.profile_image_url = uploadResult.images.original;
        } else {
          console.error('Image upload failed:', uploadResult.error);
          // 이미지 업로드 실패해도 나머지 프로필은 저장 진행
        }
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '프로필 수정에 실패했습니다.');
      }

      showAlert('프로필이 수정되었습니다!');
    } catch (err) {
      console.error('Profile update error:', err);
      showAlert(err instanceof Error ? err.message : '프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
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
                {profileImageUrl || formData.profileImage ? (
                  <img
                    src={formData.profileImage ? URL.createObjectURL(formData.profileImage) : profileImageUrl || ''}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                ) : (
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
                )}
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

          {/* 활동 지역 (국회의원 선거구 기준) */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-900">
              활동 지역 <span className="text-gray-500">(선택, 국회의원 선거구 기준)</span>
            </label>

            {/* 광역 선택 */}
            <div>
              <label htmlFor="preferredRegion" className="block text-xs text-gray-600 mb-1">
                광역시/도
              </label>
              <select
                id="preferredRegion"
                value={formData.preferredRegion}
                onChange={handleRegionChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white"
              >
                <option value="">광역시/도를 선택해주세요</option>
                {regionList.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* 선거구 선택 */}
            <div>
              <label htmlFor="preferredDistrict" className="block text-xs text-gray-600 mb-1">
                선거구
              </label>
              <select
                id="preferredDistrict"
                value={formData.preferredDistrict}
                onChange={handleDistrictChange}
                disabled={!formData.preferredRegion}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.preferredRegion ? '선거구를 선택해주세요' : '먼저 광역시/도를 선택해주세요'}
                </option>
                {districtList.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500">
              선택한 지역의 정치인 정보를 우선적으로 표시합니다.
              {formData.preferredRegion && formData.preferredDistrict && (
                <span className="block mt-1 text-secondary-600 font-medium">
                  선택: {formData.preferredRegion} {formData.preferredDistrict}
                </span>
              )}
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : (
                '저장하기'
              )}
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
