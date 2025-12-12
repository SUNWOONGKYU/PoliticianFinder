// P3BA37: 등급 변동 감지 및 알림 훅
// 활동 등급/영향력 등급 변화 시 모달 표시

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLastGrade, setLastGrade, hasGradeUpgraded } from '@/components/GradeUpgradeModal';

interface GradeNotificationState {
  showModal: boolean;
  gradeType: 'activity' | 'influence';
  previousGrade: string;
  newGrade: string;
}

interface UseGradeNotificationProps {
  activityLevel?: string;
  influenceGrade?: string;
  isLoggedIn?: boolean;
}

export function useGradeNotification({
  activityLevel,
  influenceGrade,
  isLoggedIn = false,
}: UseGradeNotificationProps) {
  const [notification, setNotification] = useState<GradeNotificationState | null>(null);

  // 등급 변화 감지
  useEffect(() => {
    if (!isLoggedIn) return;

    // 활동 등급 체크
    if (activityLevel) {
      const lastActivityLevel = getLastGrade('activity');

      if (hasGradeUpgraded('activity', lastActivityLevel, activityLevel)) {
        setNotification({
          showModal: true,
          gradeType: 'activity',
          previousGrade: lastActivityLevel || 'ML1',
          newGrade: activityLevel,
        });
      }

      setLastGrade('activity', activityLevel);
    }

    // 영향력 등급 체크
    if (influenceGrade) {
      const lastInfluenceGrade = getLastGrade('influence');

      if (hasGradeUpgraded('influence', lastInfluenceGrade, influenceGrade)) {
        // 활동 등급 알림이 없을 때만 표시 (동시에 두 개 안 띄움)
        if (!notification?.showModal) {
          setNotification({
            showModal: true,
            gradeType: 'influence',
            previousGrade: lastInfluenceGrade || 'Wanderer',
            newGrade: influenceGrade,
          });
        }
      }

      setLastGrade('influence', influenceGrade);
    }
  }, [activityLevel, influenceGrade, isLoggedIn]);

  const closeModal = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    closeModal,
  };
}

export default useGradeNotification;
