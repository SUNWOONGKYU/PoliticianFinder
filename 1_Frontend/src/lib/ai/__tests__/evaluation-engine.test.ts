// Task ID: P4BA14
// AI Evaluation Engine - Basic Tests

import { describe, it, expect } from '@jest/globals';
import { validateEvaluationResponse } from '../prompts/evaluation-prompt';

describe('AI Evaluation System', () => {
  describe('validateEvaluationResponse', () => {
    it('should validate correct response structure', () => {
      const validResponse = {
        overall_score: 85,
        overall_grade: 'A',
        summary: 'Test summary',
        strengths: ['strength1', 'strength2'],
        weaknesses: ['weakness1'],
        sources: ['source1'],
        criteria: {
          integrity: { score: 90, evidence: 'Long evidence text...' },
          expertise: { score: 85, evidence: 'Long evidence text...' },
          communication: { score: 88, evidence: 'Long evidence text...' },
          leadership: { score: 86, evidence: 'Long evidence text...' },
          transparency: { score: 92, evidence: 'Long evidence text...' },
          responsiveness: { score: 84, evidence: 'Long evidence text...' },
          innovation: { score: 80, evidence: 'Long evidence text...' },
          collaboration: { score: 87, evidence: 'Long evidence text...' },
          constituency_service: { score: 89, evidence: 'Long evidence text...' },
          policy_impact: { score: 83, evidence: 'Long evidence text...' },
        },
      };

      expect(validateEvaluationResponse(validResponse)).toBe(true);
    });

    it('should reject response with missing fields', () => {
      const invalidResponse = {
        overall_score: 85,
        // Missing other required fields
      };

      expect(validateEvaluationResponse(invalidResponse)).toBe(false);
    });

    it('should reject response with invalid score range', () => {
      const invalidResponse = {
        overall_score: 85,
        overall_grade: 'A',
        summary: 'Test',
        strengths: [],
        weaknesses: [],
        sources: [],
        criteria: {
          integrity: { score: 150, evidence: 'Test' }, // Invalid score > 100
          // ... other criteria
        },
      };

      expect(validateEvaluationResponse(invalidResponse)).toBe(false);
    });
  });
});
