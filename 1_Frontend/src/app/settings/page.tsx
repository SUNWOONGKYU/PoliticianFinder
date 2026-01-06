'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// 설정 타입 정의
interface NotificationSettings {
  comments: boolean;
  likes: boolean;
  shares: boolean;
  politicianUpdates: boolean;
}

interface AccountSettings {
  private: boolean;
}

// 로컬스토리지 키
const SETTINGS_STORAGE_KEY = 'politicianfinder_user_settings';

// 기본 설정 값
const defaultNotifications: NotificationSettings = {
  comments: true,
  likes: true,
  shares: true,
  politicianUpdates: false,
};

const defaultAccountSettings: AccountSettings = {
  private: false,
};

export default function SettingsPage() {
  // P7F1: Page-level authentication protection
  const { user: authUser, loading: authLoading } = useRequireAuth();

  // P7F1: Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(defaultAccountSettings);
  const [language, setLanguage] = useState('ko');
  const [theme, setTheme] = useState('light');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // 설정 로드 (localStorage)
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.accountSettings) setAccountSettings(parsed.accountSettings);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.theme) setTheme(parsed.theme);
        }
      } catch (error) {
        console.error('설정 로드 오류:', error);
      }
    };
    loadSettings();
  }, []);

  // 설정 저장 (localStorage)
  const saveSettings = () => {
    try {
      const settings = {
        notifications,
        accountSettings,
        language,
        theme,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('설정 저장 오류:', error);
      return false;
    }
  };

  // 알림 설정 변경 핸들러
  const handleNotificationChange = async (key: keyof NotificationSettings) => {
    setIsSavingSettings(true);
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(newNotifications);

    // 잠시 후 저장 (디바운스 효과)
    setTimeout(() => {
      const settings = {
        notifications: newNotifications,
        accountSettings,
        language,
        theme,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setIsSavingSettings(false);
    }, 300);
  };

  // 계정 설정 변경 핸들러
  const handleAccountSettingChange = async (key: keyof AccountSettings) => {
    setIsSavingSettings(true);
    const newAccountSettings = {
      ...accountSettings,
      [key]: !accountSettings[key],
    };
    setAccountSettings(newAccountSettings);

    setTimeout(() => {
      const settings = {
        notifications,
        accountSettings: newAccountSettings,
        language,
        theme,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setIsSavingSettings(false);
    }, 300);
  };

  // 언어 변경 핸들러
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const settings = {
      notifications,
      accountSettings,
      language: newLanguage,
      theme,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  };

  // 테마 변경 핸들러
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    const settings = {
      notifications,
      accountSettings,
      language,
      theme: newTheme,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

    // 테마 적용
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // 시스템 설정 따르기
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // 비밀번호 변경 핸들러 (Supabase Auth API 사용)
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlertType('error');
      setAlertMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setAlertType('error');
      setAlertMessage('비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const supabase = createClient();

      // Supabase Auth로 비밀번호 변경
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        throw error;
      }

      setAlertType('success');
      setAlertMessage('비밀번호가 성공적으로 변경되었습니다!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('비밀번호 변경 오류:', error);
      setAlertType('error');

      if (error.message?.includes('Auth session missing')) {
        setAlertMessage('세션이 만료되었습니다. 다시 로그인해주세요.');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        setAlertMessage(error.message || '비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      setAlertType('error');
      setAlertMessage('비밀번호를 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
          confirm: true
        })
      });

      const data = await response.json();

      if (data.success) {
        // 로컬스토리지 설정 삭제
        localStorage.removeItem(SETTINGS_STORAGE_KEY);

        setAlertType('success');
        setAlertMessage('계정이 삭제되었습니다. 이용해주셔서 감사합니다.');
        setShowDeleteModal(false);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setAlertType('error');
        setAlertMessage(data.error?.message || '계정 삭제에 실패했습니다.');
      }
    } catch (error) {
      setAlertType('error');
      setAlertMessage('서버 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b-2 border-primary-500">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                PoliticianFinder
              </Link>
              <div className="hidden md:block w-48">
                <div className="font-bold text-gray-900" style={{ fontSize: 'clamp(0.5rem, 3vw, 1rem)' }}>
                  훌륭한 정치인 찾기
                </div>
                <div className="text-gray-900 font-medium" style={{ fontSize: 'clamp(0.38rem, 2.28vw, 0.7125rem)' }}>
                  AI 기반 정치인 평가 플랫폼
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <Link href="/mypage" className="flex items-center gap-2 text-gray-900 hover:text-primary-600 font-medium">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                마이페이지
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600 mt-2">계정 및 알림 설정을 관리할 수 있습니다.</p>
          {isSavingSettings && (
            <p className="text-sm text-primary-600 mt-1">설정 저장 중...</p>
          )}
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">알림 설정</h2>

          <div className="space-y-4">
            {/* 댓글 알림 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <h3 className="font-medium text-gray-900">댓글 알림</h3>
                <p className="text-sm text-gray-500">내 게시글에 댓글이 달렸을 때 알림을 받습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.comments}
                  onChange={() => handleNotificationChange('comments')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-500"></div>
              </label>
            </div>

            {/* 공감 알림 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <h3 className="font-medium text-gray-900">공감 알림</h3>
                <p className="text-sm text-gray-500">내 게시글이나 댓글에 공감을 받았을 때 알림을 받습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.likes}
                  onChange={() => handleNotificationChange('likes')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-500"></div>
              </label>
            </div>

            {/* 공유 알림 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <h3 className="font-medium text-gray-900">공유 알림</h3>
                <p className="text-sm text-gray-500">내 게시글이 공유되었을 때 알림을 받습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.shares}
                  onChange={() => handleNotificationChange('shares')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-500"></div>
              </label>
            </div>

            {/* 정치인 업데이트 알림 */}
            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">정치인 업데이트 알림</h3>
                <p className="text-sm text-gray-500">관심 정치인의 새로운 활동이 있을 때 알림을 받습니다</p>
                <Link href="/favorites" className="text-xs text-secondary-600 hover:text-secondary-700 font-medium mt-1 inline-block">
                  관심 정치인 관리 →
                </Link>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.politicianUpdates}
                  onChange={() => handleNotificationChange('politicianUpdates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">비밀번호 변경</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-900 mb-2">
                현재 비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="current-password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                disabled={isChangingPassword}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-900 mb-2">
                새 비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="new-password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                disabled={isChangingPassword}
              />
              <p className="text-xs text-gray-500 mt-1">8자 이상, 영문, 숫자, 특수문자를 포함해주세요.</p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-900 mb-2">
                새 비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirm-password"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                disabled={isChangingPassword}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    변경 중...
                  </>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 계정 관리 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">계정 관리</h2>

          <div className="space-y-4">
            {/* 계정 비공개 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <h3 className="font-medium text-gray-900">계정 비공개</h3>
                <p className="text-sm text-gray-500">내 활동을 다른 사람에게 공개하지 않습니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={accountSettings.private}
                  onChange={() => handleAccountSettingChange('private')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-secondary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-500"></div>
              </label>
            </div>

            {/* 계정 삭제 */}
            <div className="pt-3">
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium transition"
              >
                계정 삭제
              </button>
              <p className="text-xs text-gray-500 mt-2">계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
            </div>
          </div>
        </div>

        {/* 기타 설정 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">기타 설정</h2>

          <div className="space-y-4">
            {/* 언어 설정 */}
            <div className="py-3 border-b">
              <label htmlFor="language" className="block text-sm font-medium text-gray-900 mb-2">
                언어
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* 테마 설정 */}
            <div className="py-3">
              <label htmlFor="theme" className="block text-sm font-medium text-gray-900 mb-2">
                테마
              </label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
              >
                <option value="light">라이트 모드</option>
                <option value="dark">다크 모드</option>
                <option value="auto">시스템 설정 따르기</option>
              </select>
            </div>
          </div>
        </div>

        {/* 마이페이지로 돌아가기 */}
        <div className="mt-6">
          <Link href="/mypage" className="inline-flex items-center text-secondary-600 hover:text-secondary-700 font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            마이페이지로 돌아가기
          </Link>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">계정 삭제</h3>
            <p className="text-gray-600 mb-4">
              정말로 계정을 삭제하시겠습니까?<br />
              모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            <div className="mb-4">
              <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                id="deletePassword"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '계정 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="mb-6">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                alertType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {alertType === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <p className="text-gray-900 text-center whitespace-pre-line">{alertMessage}</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setAlertMessage(null)}
                className={`px-8 py-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                  alertType === 'success'
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                    : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500'
                }`}
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
