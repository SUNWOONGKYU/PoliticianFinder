// P4BA5: 욕설 필터 - 메인 필터 유틸
// 작업일: 2025-11-07
// 설명: 욕설 감지 및 필터링 함수

import {
  profanityWords,
  profanityPatterns,
  allowedWords,
  specialCharsRegex,
  ProfanityLevel,
  profanityLevels,
} from './profanity-words'

/**
 * 욕설 감지 결과 인터페이스
 */
export interface ProfanityDetectionResult {
  /** 욕설 포함 여부 */
  hasProfanity: boolean
  /** 감지된 욕설 단어 목록 */
  detectedWords: string[]
  /** 욕설 강도 (최고 레벨) */
  maxLevel: ProfanityLevel
  /** 감지된 위치 (시작 인덱스) */
  positions: number[]
}

/**
 * 텍스트 정규화
 * - 특수문자 제거
 * - 소문자 변환
 * - 공백 제거
 */
function normalizeText(text: string): string {
  return text
    .replace(specialCharsRegex, '')
    .toLowerCase()
    .trim()
}

/**
 * 허용 단어 체크
 * - 욕설로 오인될 수 있는 일반 단어 확인
 */
function isAllowedWord(text: string): boolean {
  const normalized = normalizeText(text)
  return allowedWords.some((word) => normalized.includes(word))
}

/**
 * 욕설 포함 여부 확인 (단순 체크)
 *
 * @param text 검사할 텍스트
 * @returns 욕설 포함 여부
 *
 * @example
 * containsProfanity('안녕하세요') // false
 * containsProfanity('이 시발새끼야') // true
 */
export function containsProfanity(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false
  }

  // 허용 단어 체크
  if (isAllowedWord(text)) {
    return false
  }

  const normalized = normalizeText(text)

  // 1. 완전 일치 검사
  for (const word of profanityWords) {
    if (normalized.includes(word)) {
      return true
    }
  }

  // 2. 패턴 매칭 검사 (변형된 욕설)
  for (const { pattern } of profanityPatterns) {
    if (pattern.test(normalized)) {
      return true
    }
  }

  return false
}

/**
 * 욕설 상세 감지
 * - 어떤 욕설이 어디에 있는지 상세 정보 반환
 *
 * @param text 검사할 텍스트
 * @returns 욕설 감지 결과
 *
 * @example
 * const result = detectProfanity('이 시발 새끼야')
 * // {
 * //   hasProfanity: true,
 * //   detectedWords: ['시발', '새끼'],
 * //   maxLevel: 3,
 * //   positions: [2, 5]
 * // }
 */
export function detectProfanity(text: string): ProfanityDetectionResult {
  const result: ProfanityDetectionResult = {
    hasProfanity: false,
    detectedWords: [],
    maxLevel: ProfanityLevel.MILD,
    positions: [],
  }

  if (!text || text.trim().length === 0) {
    return result
  }

  // 허용 단어 체크
  if (isAllowedWord(text)) {
    return result
  }

  const normalized = normalizeText(text)
  const detectedSet = new Set<string>()
  let maxLevel = ProfanityLevel.MILD

  // 1. 완전 일치 검사
  for (const word of profanityWords) {
    let index = normalized.indexOf(word)
    while (index !== -1) {
      detectedSet.add(word)
      result.positions.push(index)

      // 강도 레벨 업데이트
      const level = profanityLevels[word] || ProfanityLevel.MILD
      if (level > maxLevel) {
        maxLevel = level
      }

      index = normalized.indexOf(word, index + 1)
    }
  }

  // 2. 패턴 매칭 검사
  for (const { word, pattern } of profanityPatterns) {
    const matches = normalized.match(pattern)
    if (matches) {
      detectedSet.add(word)
      const level = profanityLevels[word] || ProfanityLevel.MILD
      if (level > maxLevel) {
        maxLevel = level
      }
    }
  }

  result.detectedWords = Array.from(detectedSet)
  result.hasProfanity = result.detectedWords.length > 0
  result.maxLevel = maxLevel

  return result
}

/**
 * 텍스트에서 욕설 필터링 (마스킹)
 * - 욕설을 *** 또는 첫 글자 + ** 로 대체
 *
 * @param text 필터링할 텍스트
 * @param maskChar 마스킹 문자 (기본: '*')
 * @param keepFirstChar 첫 글자 유지 여부 (기본: true)
 * @returns 필터링된 텍스트
 *
 * @example
 * filterProfanity('시발 새끼야') // '시** 새**야'
 * filterProfanity('시발 새끼야', '*', false) // '*** ***야'
 */
export function filterProfanity(
  text: string,
  maskChar: string = '*',
  keepFirstChar: boolean = true
): string {
  if (!text || text.trim().length === 0) {
    return text
  }

  // 허용 단어 체크
  if (isAllowedWord(text)) {
    return text
  }

  let filtered = text

  // 1. 완전 일치 욕설 대체
  for (const word of profanityWords) {
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, (match) => {
      if (keepFirstChar && match.length > 0) {
        return match[0] + maskChar.repeat(match.length - 1)
      }
      return maskChar.repeat(match.length)
    })
  }

  // 2. 패턴 매칭 욕설 대체
  for (const { pattern } of profanityPatterns) {
    filtered = filtered.replace(pattern, (match) => {
      if (keepFirstChar && match.length > 0) {
        return match[0] + maskChar.repeat(Math.max(1, match.length - 1))
      }
      return maskChar.repeat(Math.max(2, match.length))
    })
  }

  return filtered
}

/**
 * 텍스트 검열 (욕설 포함 시 전체 거부)
 * - 욕설이 포함되어 있으면 null 반환
 * - 욕설이 없으면 원본 텍스트 반환
 *
 * @param text 검사할 텍스트
 * @returns 욕설 없으면 원본, 있으면 null
 *
 * @example
 * censorProfanity('안녕하세요') // '안녕하세요'
 * censorProfanity('시발') // null
 */
export function censorProfanity(text: string): string | null {
  if (containsProfanity(text)) {
    return null
  }
  return text
}

/**
 * 욕설 레벨별 필터링 정책 적용
 * - 레벨에 따라 다른 처리 수행
 *
 * @param text 검사할 텍스트
 * @param allowedLevel 허용 레벨 (이하는 허용)
 * @returns 처리 결과 { allowed: boolean, filtered: string }
 *
 * @example
 * filterByLevel('미친듯이 재밌어요', ProfanityLevel.MODERATE)
 * // { allowed: true, filtered: '미친듯이 재밌어요' }
 *
 * filterByLevel('시발 새끼야', ProfanityLevel.MODERATE)
 * // { allowed: false, filtered: '시** 새**야' }
 */
export function filterByLevel(
  text: string,
  allowedLevel: ProfanityLevel = ProfanityLevel.MILD
): { allowed: boolean; filtered: string } {
  const detection = detectProfanity(text)

  if (!detection.hasProfanity) {
    return { allowed: true, filtered: text }
  }

  if (detection.maxLevel <= allowedLevel) {
    return { allowed: true, filtered: text }
  }

  return {
    allowed: false,
    filtered: filterProfanity(text),
  }
}

/**
 * API 응답용 욕설 검증 유틸
 * - 욕설 포함 시 에러 객체 반환
 *
 * @param text 검사할 텍스트
 * @param fieldName 필드명 (에러 메시지용)
 * @returns { valid: boolean, error?: string }
 *
 * @example
 * validateProfanity('안녕하세요', 'content')
 * // { valid: true }
 *
 * validateProfanity('시발', 'content')
 * // { valid: false, error: 'content 필드에 부적절한 언어가 포함되어 있습니다.' }
 */
export function validateProfanity(
  text: string,
  fieldName: string = 'text'
): { valid: boolean; error?: string } {
  const detection = detectProfanity(text)

  if (!detection.hasProfanity) {
    return { valid: true }
  }

  return {
    valid: false,
    error: `${fieldName} 필드에 부적절한 언어가 포함되어 있습니다.`,
  }
}

/**
 * 배치 텍스트 필터링
 * - 여러 텍스트를 한 번에 필터링
 *
 * @param texts 텍스트 배열
 * @param maskChar 마스킹 문자
 * @param keepFirstChar 첫 글자 유지 여부
 * @returns 필터링된 텍스트 배열
 */
export function filterMultiple(
  texts: string[],
  maskChar: string = '*',
  keepFirstChar: boolean = true
): string[] {
  return texts.map((text) => filterProfanity(text, maskChar, keepFirstChar))
}

/**
 * 욕설 통계 정보
 * - 텍스트 내 욕설 분석 통계
 *
 * @param text 분석할 텍스트
 * @returns 통계 정보
 */
export function getProfanityStats(text: string): {
  totalWords: number
  profanityCount: number
  profanityRatio: number
  detectedWords: string[]
  maxLevel: ProfanityLevel
} {
  const detection = detectProfanity(text)
  const words = text.split(/\s+/).filter((w) => w.length > 0)

  return {
    totalWords: words.length,
    profanityCount: detection.detectedWords.length,
    profanityRatio:
      words.length > 0 ? detection.detectedWords.length / words.length : 0,
    detectedWords: detection.detectedWords,
    maxLevel: detection.maxLevel,
  }
}

// ============================================================================
// 내보내기
// ============================================================================

export default {
  containsProfanity,
  detectProfanity,
  filterProfanity,
  censorProfanity,
  filterByLevel,
  validateProfanity,
  filterMultiple,
  getProfanityStats,
}
