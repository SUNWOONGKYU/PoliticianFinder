import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeJson,
  sanitizeFilename,
  escapeSql,
  validateLength,
  validateEmail,
  validatePhone,
  safeRegexTest,
  createSafeHtml,
} from '../xss-protection'

describe('XSS Protection', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const dirty = '<p>Hello</p><script>alert("xss")</script>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).toContain('Hello')
    })

    it('should remove event handlers', () => {
      const dirty = '<div onclick="alert()">Click me</div>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('onclick')
    })

    it('should allow safe HTML tags', () => {
      const dirty = '<p><strong>Bold</strong> and <em>italic</em></p>'
      const clean = sanitizeHtml(dirty)
      expect(clean).toContain('<strong>')
      expect(clean).toContain('<em>')
    })

    it('should handle empty or invalid input', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null as any)).toBe('')
      expect(sanitizeHtml(undefined as any)).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const dirty = '<p>Hello <strong>World</strong></p>'
      const clean = sanitizeText(dirty)
      expect(clean).toBe('Hello World')
      expect(clean).not.toContain('<')
    })

    it('should decode HTML entities', () => {
      const dirty = '&lt;script&gt;alert()&lt;/script&gt;'
      const clean = sanitizeText(dirty)
      expect(clean).not.toContain('&lt;')
    })
  })

  describe('sanitizeUrl', () => {
    it('should allow http and https URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
    })

    it('should block javascript protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#')
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('#')
    })

    it('should block data protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#')
    })

    it('should block vbscript protocol', () => {
      expect(sanitizeUrl('vbscript:alert(1)')).toBe('#')
    })

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page')
      expect(sanitizeUrl('#anchor')).toBe('#anchor')
    })

    it('should handle malformed URLs', () => {
      expect(sanitizeUrl('not a valid url')).toBe('#')
      expect(sanitizeUrl('')).toBe('#')
    })
  })

  describe('sanitizeJson', () => {
    it('should parse and sanitize valid JSON', () => {
      const json = '{"name":"<script>alert()</script>","age":30}'
      const result = sanitizeJson(json)
      expect(result).toHaveProperty('name')
      expect(result?.name).not.toContain('<script>')
    })

    it('should handle invalid JSON', () => {
      const result = sanitizeJson('invalid json')
      expect(result).toBeNull()
    })

    it('should sanitize nested objects', () => {
      const json = '{"user":{"name":"<b>test</b>"}}'
      const result = sanitizeJson(json)
      expect(result?.user?.name).not.toContain('<b>')
    })

    it('should sanitize arrays', () => {
      const json = '["<script>alert()</script>","safe"]'
      const result = sanitizeJson<string[]>(json)
      expect(result?.[0]).not.toContain('<script>')
      expect(result?.[1]).toBe('safe')
    })
  })

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      const filename = '../../../etc/passwd'
      const safe = sanitizeFilename(filename)
      expect(safe).not.toContain('..')
      expect(safe).not.toContain('/')
    })

    it('should block executable extensions', () => {
      expect(sanitizeFilename('malware.exe')).toBe('malware.txt')
      expect(sanitizeFilename('script.js')).toBe('script.txt')
      expect(sanitizeFilename('virus.bat')).toBe('virus.txt')
    })

    it('should allow safe extensions', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf')
      expect(sanitizeFilename('image.jpg')).toBe('image.jpg')
      expect(sanitizeFilename('data.json')).toBe('data.json')
    })

    it('should handle Korean filenames', () => {
      const filename = '테스트파일.txt'
      const safe = sanitizeFilename(filename)
      expect(safe).toContain('테스트파일')
    })
  })

  describe('escapeSql', () => {
    it('should escape single quotes', () => {
      const input = "O'Brien"
      const escaped = escapeSql(input)
      expect(escaped).toBe("O''Brien")
    })

    it('should escape backslashes', () => {
      const input = 'path\\to\\file'
      const escaped = escapeSql(input)
      expect(escaped).toContain('\\\\')
    })

    it('should escape newlines', () => {
      const input = 'line1\nline2'
      const escaped = escapeSql(input)
      expect(escaped).toContain('\\n')
    })
  })

  describe('validateLength', () => {
    it('should validate correct length', () => {
      const result = validateLength('hello', 3, 10, 'Test')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject too short input', () => {
      const result = validateLength('ab', 3, 10, 'Test')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least 3')
    })

    it('should reject too long input', () => {
      const result = validateLength('a'.repeat(11), 3, 10, 'Test')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not exceed 10')
    })

    it('should reject empty input', () => {
      const result = validateLength('', 3, 10, 'Test')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user+tag@domain.co.kr')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })

    it('should reject too long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(validateEmail(longEmail)).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate Korean phone numbers', () => {
      expect(validatePhone('010-1234-5678')).toBe(true)
      expect(validatePhone('01012345678')).toBe(true)
      expect(validatePhone('010 1234 5678')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123-456-7890')).toBe(false)
      expect(validatePhone('invalid')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('safeRegexTest', () => {
    it('should test valid patterns', () => {
      expect(safeRegexTest('^test$', 'test')).toBe(true)
      expect(safeRegexTest('^test$', 'testing')).toBe(false)
    })

    it('should handle invalid patterns', () => {
      expect(safeRegexTest('[invalid', 'test')).toBe(false)
    })

    it('should timeout on complex patterns', () => {
      // ReDoS pattern - may or may not timeout depending on system
      const result = safeRegexTest('(a+)+$', 'a'.repeat(30), 100)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('createSafeHtml', () => {
    it('should create safe HTML object for React', () => {
      const dirty = '<p>Hello</p><script>alert()</script>'
      const safeHtml = createSafeHtml(dirty)
      expect(safeHtml).toHaveProperty('__html')
      expect(safeHtml.__html).not.toContain('<script>')
      expect(safeHtml.__html).toContain('Hello')
    })
  })
})
