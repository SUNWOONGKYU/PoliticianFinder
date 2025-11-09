// P4BA5: 욕설 필터 - 욕설 단어 목록
// 작업일: 2025-11-07
// 설명: 한국어 욕설 및 비속어 목록

/**
 * 욕설 단어 목록
 * - 완전 일치 검사에 사용
 * - 정규식 패턴 생성에 사용
 */
export const profanityWords: string[] = [
  // 일반 욕설
  '시발',
  '씨발',
  '시팔',
  '씨팔',
  '개새끼',
  '개새',
  '개색',
  '개색끼',
  '새끼',
  '씹',
  '좆',
  '좃',
  '존나',
  '졸라',
  'ㅈㄴ',
  '병신',
  '븅신',
  '미친',
  '미친놈',
  '미친년',
  '또라이',
  '미친새끼',
  '지랄',
  '지럴',
  '씨부랄',
  '씨불',
  'ㅅㅂ',
  'ㅆㅂ',
  'ㅂㅅ',
  'ㄱㅅㄲ',

  // 성적 비속어
  '섹스',
  'sex',
  '야동',
  '야사',

  // 차별/혐오 표현
  '장애인',
  '병신',
  '찐따',
  '루저',
  '쓰레기',

  // 변형 욕설 (자음만)
  'ㅅㅂ',
  'ㅆㅂ',
  'ㅂㅅ',
  'ㅈㄴ',
  'ㄱㅅㄲ',
]

/**
 * 욕설 패턴 (정규식 생성용)
 * - 자음/모음 분리 패턴
 * - 특수문자 삽입 패턴
 */
export const profanityPatterns: { word: string; pattern: RegExp }[] = [
  // 시발 변형
  { word: '시발', pattern: /[시씨][ㅂ빠바팔발파]/ },
  { word: '시발', pattern: /ㅅ[ㅣ이1l]?ㅂ[ㅏ아]?[ㄹ을]/},

  // 개새끼 변형
  { word: '개새끼', pattern: /개[ㅅ새색][ㅐ애]?[ㄲ끼키]/ },
  { word: '개새끼', pattern: /[ㄱ개][ㅅ새][ㄲ끼]/ },

  // 병신 변형
  { word: '병신', pattern: /[병븅뷩][ㅅ신싄]/ },
  { word: '병신', pattern: /ㅂ[ㅕ여]?ㅇ?ㅅ[ㅣ이]?ㄴ/ },

  // 좆 변형
  { word: '좆', pattern: /[좆좃졷]/ },
  { word: '좆', pattern: /ㅈ[ㅗ오]?[ㅈㅅ]/ },

  // 존나 변형
  { word: '존나', pattern: /[존졸좆][ㄴ나내]/ },
  { word: '존나', pattern: /ㅈ[ㅗ오]?[ㄴㄹ][ㄴ나]/ },

  // 씨발 변형
  { word: '씨발', pattern: /[씨ㅆ][ㅂ빠바팔발]/ },

  // 미친 변형
  { word: '미친', pattern: /[미]?[ㅊ친]/ },

  // 지랄 변형
  { word: '지랄', pattern: /[지ㅈ][ㄹ랄럴]/ },
]

/**
 * 허용 단어 목록 (예외 처리)
 * - 일반 단어인데 욕설로 오인될 수 있는 경우
 */
export const allowedWords: string[] = [
  '미친듯이',  // 긍정적 의미로 사용
  '개발자',    // '개' 포함이지만 일반 단어
  '개선',
  '개요',
  '개인',
  '개최',
  '새로운',
  '새해',
]

/**
 * 특수문자 제거 정규식
 * - 욕설 우회를 위한 특수문자 삽입 감지
 */
export const specialCharsRegex = /[\s\-_\.~!@#$%^&*()+=\[\]{}|\\:;"'<>,.?\/]/g

/**
 * 욕설 강도 레벨
 */
export enum ProfanityLevel {
  MILD = 1,      // 경미한 비속어
  MODERATE = 2,  // 중간 수준
  SEVERE = 3,    // 심각한 욕설
  EXTREME = 4,   // 극심한 욕설
}

/**
 * 단어별 강도 매핑
 */
export const profanityLevels: Record<string, ProfanityLevel> = {
  // MILD (1)
  '미친': ProfanityLevel.MILD,
  '또라이': ProfanityLevel.MILD,
  '찐따': ProfanityLevel.MILD,

  // MODERATE (2)
  '병신': ProfanityLevel.MODERATE,
  '븅신': ProfanityLevel.MODERATE,
  '지랄': ProfanityLevel.MODERATE,
  '쓰레기': ProfanityLevel.MODERATE,

  // SEVERE (3)
  '시발': ProfanityLevel.SEVERE,
  '씨발': ProfanityLevel.SEVERE,
  '새끼': ProfanityLevel.SEVERE,
  '씹': ProfanityLevel.SEVERE,

  // EXTREME (4)
  '좆': ProfanityLevel.EXTREME,
  '좃': ProfanityLevel.EXTREME,
  '존나': ProfanityLevel.EXTREME,
  '개새끼': ProfanityLevel.EXTREME,
  '씨부랄': ProfanityLevel.EXTREME,
}
