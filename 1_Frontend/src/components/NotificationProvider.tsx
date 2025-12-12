// P3BA37: 알림 제공자 컴포넌트
// 토스트 알림 및 등급 승급 모달 관리

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from './Toast';
import GradeUpgradeModal from './GradeUpgradeModal';

// 토스트 알림 타입
interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// 등급 승급 모달 타입
interface GradeUpgradeNotification {
  gradeType: 'activity' | 'influence';
  previousGrade: string;
  newGrade: string;
}

// Context 타입
interface NotificationContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showFollowerToast: (followerName: string, followerCount: number) => void;
  showPointsToast: (points: number, reason: string) => void;
  showGradeUpgrade: (notification: GradeUpgradeNotification) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [gradeModal, setGradeModal] = useState<GradeUpgradeNotification | null>(null);

  // 일반 토스트 표시
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // 팔로워 획득 토스트
  const showFollowerToast = useCallback((followerName: string, followerCount: number) => {
    const id = `toast-${Date.now()}`;
    const message = `🎉 ${followerName}님이 팔로우했습니다! (팔로워 ${followerCount}명)`;
    setToasts((prev) => [...prev, { id, message, type: 'success' }]);
  }, []);

  // 포인트 획득 토스트
  const showPointsToast = useCallback((points: number, reason: string) => {
    const id = `toast-${Date.now()}`;
    const message = `⭐ +${points}P 획득! (${reason})`;
    setToasts((prev) => [...prev, { id, message, type: 'success' }]);
  }, []);

  // 등급 승급 모달 표시
  const showGradeUpgrade = useCallback((notification: GradeUpgradeNotification) => {
    setGradeModal(notification);
  }, []);

  // 토스트 닫기
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 등급 모달 닫기
  const closeGradeModal = useCallback(() => {
    setGradeModal(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        showFollowerToast,
        showPointsToast,
        showGradeUpgrade,
      }}
    >
      {children}

      {/* 토스트 컨테이너 */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* 등급 승급 모달 */}
      {gradeModal && (
        <GradeUpgradeModal
          isOpen={true}
          onClose={closeGradeModal}
          gradeType={gradeModal.gradeType}
          previousGrade={gradeModal.previousGrade}
          newGrade={gradeModal.newGrade}
        />
      )}
    </NotificationContext.Provider>
  );
}
