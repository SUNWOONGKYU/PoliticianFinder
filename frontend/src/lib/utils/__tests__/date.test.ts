import { formatDistanceToNow } from '../date'

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    // Mock current time to ensure consistent test results
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return "방금" for dates less than 60 seconds ago', () => {
    const date = new Date('2024-01-15T11:59:30Z')
    expect(formatDistanceToNow(date)).toBe('방금')
  })

  it('should return minutes for dates less than 60 minutes ago', () => {
    const date = new Date('2024-01-15T11:45:00Z')
    expect(formatDistanceToNow(date)).toBe('15분')
  })

  it('should return hours for dates less than 24 hours ago', () => {
    const date = new Date('2024-01-15T09:00:00Z')
    expect(formatDistanceToNow(date)).toBe('3시간')
  })

  it('should return days for dates less than 7 days ago', () => {
    const date = new Date('2024-01-12T12:00:00Z')
    expect(formatDistanceToNow(date)).toBe('3일')
  })

  it('should return weeks for dates less than 4 weeks ago', () => {
    const date = new Date('2024-01-01T12:00:00Z')
    expect(formatDistanceToNow(date)).toBe('2주')
  })

  it('should return months for dates less than 12 months ago', () => {
    const date = new Date('2023-11-15T12:00:00Z')
    expect(formatDistanceToNow(date)).toBe('2개월')
  })

  it('should return years for dates more than 12 months ago', () => {
    const date = new Date('2022-01-15T12:00:00Z')
    expect(formatDistanceToNow(date)).toBe('2년')
  })

  it('should add suffix when addSuffix option is true', () => {
    const date = new Date('2024-01-15T11:45:00Z')
    expect(formatDistanceToNow(date, { addSuffix: true })).toBe('15분 전')
  })

  it('should not add suffix to "방금"', () => {
    const date = new Date('2024-01-15T11:59:30Z')
    expect(formatDistanceToNow(date, { addSuffix: true })).toBe('방금')
  })

  it('should handle edge case of exactly 1 minute', () => {
    const date = new Date('2024-01-15T11:59:00Z')
    expect(formatDistanceToNow(date)).toBe('1분')
  })

  it('should handle edge case of exactly 1 hour', () => {
    const date = new Date('2024-01-15T11:00:00Z')
    expect(formatDistanceToNow(date)).toBe('1시간')
  })

  it('should handle edge case of exactly 1 day', () => {
    const date = new Date('2024-01-14T12:00:00Z')
    expect(formatDistanceToNow(date)).toBe('1일')
  })
})
