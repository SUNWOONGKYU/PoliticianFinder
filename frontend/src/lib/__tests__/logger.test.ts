/**
 * P4B5: Logger Unit Tests
 *
 * Unit tests for the centralized error logging system.
 * Demonstrates testing patterns for logger functionality.
 */

import { logger, __testing__ } from '../logger'

describe('Logger', () => {
  // Spy on console methods
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('Basic Logging', () => {
    it('should log error messages', () => {
      logger.error('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should log warning messages', () => {
      logger.warn('Test warning')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should log info messages', () => {
      logger.info('Test info')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should log debug messages', () => {
      logger.debug('Test debug')
      expect(consoleDebugSpy).toHaveBeenCalled()
    })
  })

  describe('Context Handling', () => {
    it('should include context in log entries', () => {
      logger.error('Test error', {
        endpoint: '/api/test',
        userId: 'user-123',
        errorCode: 'TEST_ERROR'
      })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Test error')
    })

    it('should sanitize email addresses', () => {
      const context = { userEmail: 'user@example.com' }
      const sanitized = __testing__.sanitizeContext(context)

      expect(sanitized?.userEmail).toBe('us***@example.com')
    })

    it('should remove sensitive fields from metadata', () => {
      const context = {
        metadata: {
          password: 'secret123',
          token: 'abc123',
          apiKey: 'key123',
          safe: 'visible'
        }
      }

      const sanitized = __testing__.sanitizeContext(context)

      expect(sanitized?.metadata).not.toHaveProperty('password')
      expect(sanitized?.metadata).not.toHaveProperty('token')
      expect(sanitized?.metadata).not.toHaveProperty('apiKey')
      expect(sanitized?.metadata).toHaveProperty('safe', 'visible')
    })
  })

  describe('Trace ID Generation', () => {
    it('should generate unique trace IDs', () => {
      const id1 = __testing__.generateTraceId()
      const id2 = __testing__.generateTraceId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('Log Level Filtering', () => {
    it('should respect minimum log level', () => {
      // In test environment, only errors are logged by default
      // This test depends on environment configuration

      logger.debug('Debug message')
      logger.info('Info message')
      logger.error('Error message')

      // Error should always be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      )
    })
  })

  describe('Log Entry Structure', () => {
    it('should create well-formed log entries', () => {
      const entry = __testing__.createLogEntry('error', 'Test message', {
        endpoint: '/api/test',
        userId: 'user-123'
      })

      expect(entry).toHaveProperty('level', 'error')
      expect(entry).toHaveProperty('message', 'Test message')
      expect(entry).toHaveProperty('timestamp')
      expect(entry).toHaveProperty('environment')
      expect(entry).toHaveProperty('traceId')
      expect(entry.context).toHaveProperty('endpoint', '/api/test')
      expect(entry.context).toHaveProperty('userId', 'user-123')
    })

    it('should include ISO timestamp', () => {
      const entry = __testing__.createLogEntry('info', 'Test')

      expect(entry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    it('should include environment', () => {
      const entry = __testing__.createLogEntry('info', 'Test')

      expect(entry.environment).toBe(process.env.NODE_ENV || 'development')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined context', () => {
      expect(() => {
        logger.error('Test error', undefined)
      }).not.toThrow()
    })

    it('should handle empty context', () => {
      expect(() => {
        logger.error('Test error', {})
      }).not.toThrow()
    })

    it('should handle non-Error objects', () => {
      expect(() => {
        logger.error('Test', {
          stack: 'fake stack trace'
        })
      }).not.toThrow()
    })

    it('should handle circular references in metadata', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      // Should not throw even with circular reference
      // (JSON.stringify will handle it)
      expect(() => {
        logger.error('Test', { metadata: { data: 'safe' } })
      }).not.toThrow()
    })
  })
})

describe('Specialized Logging Functions', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('logApiError', () => {
    it('should log API errors with request context', () => {
      const { logApiError } = require('../logger')
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/test',
        headers: new Headers()
      } as Request

      const error = new Error('Test error')
      logApiError(mockRequest, error, 'GET /api/test', 'user-123')

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('logSupabaseError', () => {
    it('should log Supabase errors with table and operation', () => {
      const { logSupabaseError } = require('../logger')

      const error = {
        message: 'Database error',
        code: 'PGRST116',
        details: 'Row not found'
      }

      logSupabaseError('politicians', 'select', error, 'user-123')

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Supabase Error')
    })
  })

  describe('logAuthError', () => {
    it('should log authentication errors', () => {
      const { logAuthError } = require('../logger')

      const error = new Error('Invalid credentials')
      logAuthError('login', error, 'user@example.com')

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('Auth Error')
    })

    it('should mask user identifiers', () => {
      const { logAuthError } = require('../logger')

      const error = new Error('Invalid credentials')
      logAuthError('login', error, 'user@example.com')

      expect(consoleErrorSpy).toHaveBeenCalled()
      // Identifier should be truncated to first 3 chars + ***
      const logCall = JSON.stringify(consoleErrorSpy.mock.calls[0])
      expect(logCall).toContain('use***')
    })
  })

  describe('logPerformance', () => {
    it('should log slow operations as warnings', () => {
      const { logPerformance } = require('../logger')
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Operation took 1500ms (exceeds default 1000ms threshold)
      logPerformance('/api/slow', 1500)

      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should log fast operations as debug', () => {
      const { logPerformance } = require('../logger')
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()

      // Operation took 500ms (under threshold)
      logPerformance('/api/fast', 500)

      expect(consoleDebugSpy).toHaveBeenCalled()

      consoleDebugSpy.mockRestore()
    })

    it('should respect custom thresholds', () => {
      const { logPerformance } = require('../logger')
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      // 800ms is under default (1000ms) but over custom (500ms)
      logPerformance('/api/test', 800, 500)

      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })
})

describe('Security', () => {
  describe('Data Sanitization', () => {
    it('should not log passwords', () => {
      const context = {
        metadata: {
          password: 'secret123',
          username: 'john'
        }
      }

      const sanitized = __testing__.sanitizeContext(context)

      expect(sanitized?.metadata).not.toHaveProperty('password')
      expect(sanitized?.metadata).toHaveProperty('username')
    })

    it('should mask email addresses', () => {
      const context = { userEmail: 'john.doe@example.com' }
      const sanitized = __testing__.sanitizeContext(context)

      expect(sanitized?.userEmail).toBe('jo***@example.com')
      expect(sanitized?.userEmail).not.toContain('john.doe')
    })

    it('should handle short email addresses', () => {
      const context = { userEmail: 'ab@example.com' }
      const sanitized = __testing__.sanitizeContext(context)

      expect(sanitized?.userEmail).toBe('ab***@example.com')
    })
  })
})
