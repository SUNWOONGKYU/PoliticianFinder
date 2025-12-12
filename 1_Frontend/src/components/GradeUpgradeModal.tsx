// P3BA37: 등급 승급 모달 컴포넌트
// 활동 등급 또는 영향력 등급 승급 시 축하 팝업 표시

'use client';

import { useEffect, useState } from 'react';

// 활동 등급 정보 (ML1~ML10)
const ACTIVITY_LEVELS: Record<string, { name: string; description: string; color: string }> = {
  ML1: { name: 'ML1', description: '신규 가입', color: 'from-gray-400 to-gray-500' },
  ML2: { name: 'ML2', description: '초보 활동', color: 'from-gray-500 to-gray-600' },
  ML3: { name: 'ML3', description: '기본 활동', color: 'from-blue-400 to-blue-500' },
  ML4: { name: 'ML4', description: '적극 활동', color: 'from-blue-500 to-blue-600' },
  ML5: { name: 'ML5', description: '중급 회원', color: 'from-green-400 to-green-500' },
  ML6: { name: 'ML6', description: '숙련 회원', color: 'from-green-500 to-green-600' },
  ML7: { name: 'ML7', description: '고급 회원', color: 'from-purple-400 to-purple-500' },
  ML8: { name: 'ML8', description: '베테랑', color: 'from-purple-500 to-purple-600' },
  ML9: { name: 'ML9', description: '엘리트', color: 'from-yellow-400 to-yellow-500' },
  ML10: { name: 'ML10', description: '전설', color: 'from-yellow-500 to-orange-500' },
};

// 영향력 등급 정보 (방랑자~군주)
const INFLUENCE_GRADES: Record<string, { name: string; emoji: string; description: string; color: string }> = {
  Wanderer: { name: '방랑자', emoji: '🚶', description: '여정의 시작', color: 'from-gray-400 to-gray-500' },
  Knight: { name: '기사', emoji: '⚔️', description: '인정받는 존재', color: 'from-blue-400 to-blue-600' },
  Lord: { name: '영주', emoji: '🏰', description: '지역의 리더', color: 'from-purple-400 to-purple-600' },
  Duke: { name: '공작', emoji: '👑', description: '큰 영향력', color: 'from-yellow-400 to-yellow-600' },
  Monarch: { name: '군주', emoji: '🌟', description: '최고의 위상', color: 'from-orange-400 to-red-500' },
};

interface GradeUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeType: 'activity' | 'influence';
  previousGrade: string;
  newGrade: string;
}

export default function GradeUpgradeModal({
  isOpen,
  onClose,
  gradeType,
  previousGrade,
  newGrade,
}: GradeUpgradeModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isActivityGrade = gradeType === 'activity';
  const gradeInfo = isActivityGrade
    ? ACTIVITY_LEVELS[newGrade]
    : INFLUENCE_GRADES[newGrade];

  if (!gradeInfo) return null;

  const title = isActivityGrade ? '활동 등급 승급!' : '영향력 등급 승급!';
  const emoji = isActivityGrade ? '🎉' : (INFLUENCE_GRADES[newGrade]?.emoji || '🎉');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-bounce-in">
        {/* 컨페티 효과 */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        )}

        {/* 헤더 그라데이션 */}
        <div className={`h-2 bg-gradient-to-r ${gradeInfo.color}`} />

        {/* 본문 */}
        <div className="p-6 text-center">
          {/* 이모지 */}
          <div className="text-6xl mb-4 animate-pulse">{emoji}</div>

          {/* 타이틀 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>

          {/* 등급 변화 표시 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-lg text-gray-400">
              {isActivityGrade
                ? previousGrade
                : INFLUENCE_GRADES[previousGrade]?.name || previousGrade}
            </span>
            <span className="text-2xl">→</span>
            <span
              className={`text-2xl font-bold bg-gradient-to-r ${gradeInfo.color} bg-clip-text text-transparent`}
            >
              {isActivityGrade ? gradeInfo.name : gradeInfo.name}
            </span>
          </div>

          {/* 설명 */}
          <p className="text-gray-600 mb-6">
            {isActivityGrade
              ? `축하합니다! ${gradeInfo.description} 등급에 도달했습니다.`
              : `축하합니다! ${emoji} ${gradeInfo.name} 등급에 도달했습니다!`}
          </p>

          {/* 등급별 추가 정보 */}
          {isActivityGrade ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">
                활동 등급은 게시글, 댓글, 평가 등<br />
                직접 활동으로 올라갑니다.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">
                영향력 등급은 팔로워 수와<br />
                지역 내 순위로 결정됩니다.
              </p>
            </div>
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-6 rounded-full font-semibold text-white bg-gradient-to-r ${gradeInfo.color} hover:opacity-90 transition-opacity`}
          >
            확인
          </button>
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          width: 10px;
          height: 10px;
          animation: confetti 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// 등급 비교 유틸리티 함수
export function hasGradeUpgraded(
  gradeType: 'activity' | 'influence',
  previousGrade: string | null,
  currentGrade: string
): boolean {
  if (!previousGrade || previousGrade === currentGrade) return false;

  if (gradeType === 'activity') {
    const levels = ['ML1', 'ML2', 'ML3', 'ML4', 'ML5', 'ML6', 'ML7', 'ML8', 'ML9', 'ML10'];
    const prevIndex = levels.indexOf(previousGrade);
    const currIndex = levels.indexOf(currentGrade);
    return currIndex > prevIndex;
  } else {
    const grades = ['Wanderer', 'Knight', 'Lord', 'Duke', 'Monarch'];
    const prevIndex = grades.indexOf(previousGrade);
    const currIndex = grades.indexOf(currentGrade);
    return currIndex > prevIndex;
  }
}

// 로컬 스토리지 키
const LAST_ACTIVITY_GRADE_KEY = 'lastActivityGrade';
const LAST_INFLUENCE_GRADE_KEY = 'lastInfluenceGrade';

// 마지막 등급 저장/조회
export function getLastGrade(gradeType: 'activity' | 'influence'): string | null {
  if (typeof window === 'undefined') return null;
  const key = gradeType === 'activity' ? LAST_ACTIVITY_GRADE_KEY : LAST_INFLUENCE_GRADE_KEY;
  return localStorage.getItem(key);
}

export function setLastGrade(gradeType: 'activity' | 'influence', grade: string): void {
  if (typeof window === 'undefined') return;
  const key = gradeType === 'activity' ? LAST_ACTIVITY_GRADE_KEY : LAST_INFLUENCE_GRADE_KEY;
  localStorage.setItem(key, grade);
}
