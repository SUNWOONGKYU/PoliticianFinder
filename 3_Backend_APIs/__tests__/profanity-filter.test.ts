// P4BA5: 욕설 필터 테스트
// 작업일: 2025-11-07

import {
  containsProfanity,
  detectProfanity,
  filterProfanity,
  censorProfanity,
  validateProfanity,
  getProfanityStats,
} from '../lib/utils/profanity-filter'
import { ProfanityLevel } from '../lib/utils/profanity-words'

describe('욕설 필터 테스트', () => {
  describe('containsProfanity - 욕설 포함 여부', () => {
    test('정상 텍스트는 false 반환', () => {
      expect(containsProfanity('안녕하세요')).toBe(false)
      expect(containsProfanity('오늘 날씨가 좋네요')).toBe(false)
      expect(containsProfanity('개발자입니다')).toBe(false)
    })

    test('욕설 포함 텍스트는 true 반환', () => {
      expect(containsProfanity('시발')).toBe(true)
      expect(containsProfanity('개새끼')).toBe(true)
      expect(containsProfanity('병신')).toBe(true)
    })

    test('변형된 욕설도 감지', () => {
      expect(containsProfanity('ㅅㅂ')).toBe(true)
      expect(containsProfanity('ㅂㅅ')).toBe(true)
    })

    test('빈 문자열은 false', () => {
      expect(containsProfanity('')).toBe(false)
      expect(containsProfanity('   ')).toBe(false)
    })
  })

  describe('detectProfanity - 욕설 상세 감지', () => {
    test('정상 텍스트는 감지 없음', () => {
      const result = detectProfanity('안녕하세요')
      expect(result.hasProfanity).toBe(false)
      expect(result.detectedWords).toHaveLength(0)
    })

    test('욕설 감지 및 단어 목록 반환', () => {
      const result = detectProfanity('시발 새끼야')
      expect(result.hasProfanity).toBe(true)
      expect(result.detectedWords.length).toBeGreaterThan(0)
    })

    test('욕설 강도 레벨 반환', () => {
      const result1 = detectProfanity('미친')
      expect(result1.maxLevel).toBeLessThanOrEqual(ProfanityLevel.MILD)

      const result2 = detectProfanity('시발')
      expect(result2.maxLevel).toBeGreaterThanOrEqual(ProfanityLevel.SEVERE)
    })
  })

  describe('filterProfanity - 욕설 마스킹', () => {
    test('정상 텍스트는 그대로 반환', () => {
      expect(filterProfanity('안녕하세요')).toBe('안녕하세요')
    })

    test('욕설을 마스킹 처리', () => {
      const result = filterProfanity('시발')
      expect(result).not.toBe('시발')
      expect(result).toContain('*')
    })

    test('첫 글자 유지 옵션', () => {
      const result = filterProfanity('시발', '*', true)
      expect(result.charAt(0)).toBe('시')
      expect(result).toContain('*')
    })

    test('전체 마스킹 옵션', () => {
      const result = filterProfanity('시발', '*', false)
      expect(result).not.toContain('시')
      expect(result).toBe('**')
    })
  })

  describe('censorProfanity - 욕설 검열', () => {
    test('정상 텍스트는 원본 반환', () => {
      expect(censorProfanity('안녕하세요')).toBe('안녕하세요')
    })

    test('욕설 포함 시 null 반환', () => {
      expect(censorProfanity('시발')).toBe(null)
      expect(censorProfanity('개새끼')).toBe(null)
    })
  })

  describe('validateProfanity - API 검증', () => {
    test('정상 텍스트는 valid: true', () => {
      const result = validateProfanity('안녕하세요', 'content')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('욕설 포함 시 valid: false와 에러 메시지', () => {
      const result = validateProfanity('시발', 'content')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('content')
    })
  })

  describe('getProfanityStats - 통계 정보', () => {
    test('정상 텍스트 통계', () => {
      const stats = getProfanityStats('안녕하세요 반갑습니다')
      expect(stats.profanityCount).toBe(0)
      expect(stats.profanityRatio).toBe(0)
    })

    test('욕설 포함 텍스트 통계', () => {
      const stats = getProfanityStats('시발 이게 뭐야')
      expect(stats.profanityCount).toBeGreaterThan(0)
      expect(stats.totalWords).toBeGreaterThan(0)
    })
  })

  describe('엣지 케이스', () => {
    test('null 및 undefined 처리', () => {
      expect(containsProfanity(null as any)).toBe(false)
      expect(containsProfanity(undefined as any)).toBe(false)
    })

    test('특수문자만 있는 경우', () => {
      expect(containsProfanity('!@#$%^&*()')).toBe(false)
    })

    test('숫자만 있는 경우', () => {
      expect(containsProfanity('123456')).toBe(false)
    })

    test('허용 단어 예외 처리', () => {
      expect(containsProfanity('개발자')).toBe(false)
      expect(containsProfanity('개선')).toBe(false)
      expect(containsProfanity('새로운')).toBe(false)
    })
  })
})
