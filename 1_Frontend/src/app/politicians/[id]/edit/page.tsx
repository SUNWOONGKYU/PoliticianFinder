'use client';

/**
 * 정치인 프로필 수정 페이지
 * 이메일 인증 후 프로필 수정 가능
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileData {
  id: string;
  name: string;
  party: string;
  position: string;
  biography: string;
  details: {
    contact_email?: string;
    contact_phone?: string;
    office_address?: string;
    website_url?: string;
    social_links?: Record<string, string>;
    self_introduction?: string;
  };
}

export default function PoliticianEditPage() {
  const params = useParams();
  const router = useRouter();
  const politicianId = params.id as string;

  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // 프로필 데이터
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    biography: '',
    contact_email: '',
    contact_phone: '',
    office_address: '',
    website_url: '',
    self_introduction: '',
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
    social_youtube: ''
  });

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 프로필 조회
  useEffect(() => {
    fetchProfile();
  }, [politicianId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/politicians/${politicianId}/profile`);
      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
        const socialLinks = data.data.details?.social_links || {};
        setFormData({
          biography: data.data.biography || '',
          contact_email: data.data.details?.contact_email || '',
          contact_phone: data.data.details?.contact_phone || '',
          office_address: data.data.details?.office_address || '',
          website_url: data.data.details?.website_url || '',
          self_introduction: data.data.details?.self_introduction || '',
          social_facebook: socialLinks.facebook || '',
          social_twitter: socialLinks.twitter || '',
          social_instagram: socialLinks.instagram || '',
          social_youtube: socialLinks.youtube || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // 인증 코드 발송
  const sendVerificationCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/politicians/verify/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politician_id: politicianId,
          email: email
        })
      });

      const data = await res.json();

      if (data.success) {
        setCodeSent(true);
        setSuccess('인증 코드가 발송되었습니다. 이메일을 확인해주세요.');
      } else {
        setError(data.error || '인증 코드 발송에 실패했습니다.');
      }
    } catch (err) {
      setError('인증 코드 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인증 코드 확인
  const verifyCode = async () => {
    if (!verificationCode) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/politicians/verify/check-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politician_id: politicianId,
          email: email,
          code: verificationCode
        })
      });

      const data = await res.json();

      if (data.success && data.session_id) {
        setSessionId(data.session_id);
        setIsAuthenticated(true);
        setSuccess('인증이 완료되었습니다. 프로필을 수정할 수 있습니다.');
      } else {
        setError(data.error || '인증에 실패했습니다.');
      }
    } catch (err) {
      setError('인증 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프로필 저장
  const saveProfile = async () => {
    if (!sessionId) {
      setError('인증이 필요합니다.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const socialLinks: Record<string, string> = {};
      if (formData.social_facebook) socialLinks.facebook = formData.social_facebook;
      if (formData.social_twitter) socialLinks.twitter = formData.social_twitter;
      if (formData.social_instagram) socialLinks.instagram = formData.social_instagram;
      if (formData.social_youtube) socialLinks.youtube = formData.social_youtube;

      const updates = {
        biography: formData.biography,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        office_address: formData.office_address,
        website_url: formData.website_url,
        self_introduction: formData.self_introduction,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null
      };

      const res = await fetch(`/api/politicians/${politicianId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          updates
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('프로필이 성공적으로 저장되었습니다.');
        setTimeout(() => {
          router.push(`/politicians/${politicianId}`);
        }, 2000);
      } else {
        setError(data.error || '프로필 저장에 실패했습니다.');
      }
    } catch (err) {
      setError('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <Link href={`/politicians/${politicianId}`} className="text-primary-600 hover:underline">
            &larr; 돌아가기
          </Link>
          <h1 className="text-2xl font-bold mt-2">프로필 수정</h1>
          <p className="text-gray-600">{profile.name} ({profile.party})</p>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* 인증 섹션 */}
        {!isAuthenticated && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">이메일 인증</h2>
            <p className="text-gray-600 mb-4">
              프로필을 수정하려면 등록된 이메일로 인증이 필요합니다.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="등록된 이메일 입력"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={codeSent}
                  />
                  <button
                    onClick={sendVerificationCode}
                    disabled={loading || codeSent}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300"
                  >
                    {loading ? '발송 중...' : '인증코드 발송'}
                  </button>
                </div>
              </div>

              {codeSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    인증 코드
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6자리 인증 코드"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={verifyCode}
                      disabled={loading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                    >
                      {loading ? '확인 중...' : '인증 확인'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 프로필 수정 폼 */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">프로필 정보</h2>

            <div className="space-y-6">
              {/* 자기소개 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자기소개
                </label>
                <textarea
                  name="self_introduction"
                  value={formData.self_introduction}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="간략한 자기소개를 작성해주세요."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* 약력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  약력
                </label>
                <textarea
                  name="biography"
                  value={formData.biography}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="주요 경력 및 약력을 작성해주세요."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* 연락처 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 이메일
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    placeholder="공개용 이메일"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 전화번호
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    placeholder="02-1234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 사무실 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사무실 주소
                </label>
                <input
                  type="text"
                  name="office_address"
                  value={formData.office_address}
                  onChange={handleInputChange}
                  placeholder="사무실 주소"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* 웹사이트 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  웹사이트
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* 소셜 미디어 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소셜 미디어
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="url"
                    name="social_facebook"
                    value={formData.social_facebook}
                    onChange={handleInputChange}
                    placeholder="Facebook URL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="url"
                    name="social_twitter"
                    value={formData.social_twitter}
                    onChange={handleInputChange}
                    placeholder="Twitter/X URL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="url"
                    name="social_instagram"
                    value={formData.social_instagram}
                    onChange={handleInputChange}
                    placeholder="Instagram URL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="url"
                    name="social_youtube"
                    value={formData.social_youtube}
                    onChange={handleInputChange}
                    placeholder="YouTube URL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link
                  href={`/politicians/${politicianId}`}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </Link>
                <button
                  onClick={saveProfile}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300"
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
