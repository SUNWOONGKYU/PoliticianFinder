// Task ID: P4BA14
// AI Evaluation Engine - Basic Tests

import { describe, it, expect } from '@jest/globals';
import { validateEvaluationResponse } from '../prompts/evaluation-prompt';

describe('AI Evaluation System', () => {
  describe('validateEvaluationResponse', () => {
    it('should validate correct response structure', () => {
      // Issue #6: Evidence must be at least 100 characters as per validation function
      const longEvidence = 'This is a detailed evidence text that exceeds 100 characters to satisfy the validation requirement for AI evaluation criteria evidence strings.';

      const validResponse = {
        overall_score: 85,
        overall_grade: 'A',
        summary: 'Test summary',
        strengths: ['strength1', 'strength2'],
        weaknesses: ['weakness1'],
        sources: ['source1'],
        criteria: {
          integrity: { score: 90, evidence: longEvidence },
          expertise: { score: 85, evidence: longEvidence },
          communication: { score: 88, evidence: longEvidence },
          leadership: { score: 86, evidence: longEvidence },
          transparency: { score: 92, evidence: longEvidence },
          responsiveness: { score: 84, evidence: longEvidence },
          innovation: { score: 80, evidence: longEvidence },
          collaboration: { score: 87, evidence: longEvidence },
          constituency_service: { score: 89, evidence: longEvidence },
          policy_impact: { score: 83, evidence: longEvidence },
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
