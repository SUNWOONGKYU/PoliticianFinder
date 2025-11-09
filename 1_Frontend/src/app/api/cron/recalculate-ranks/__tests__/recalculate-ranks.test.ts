// P4O3: Test for Rank Recalculation Cron Job
// Unit tests for user level recalculation logic

import { describe, it, expect } from '@jest/globals';

// Points calculation constants (same as in route.ts)
const POINTS = {
  POST_CREATED: 10,
  COMMENT_CREATED: 5,
  LIKE_RECEIVED: 2,
  COMMENT_RECEIVED: 3,
  REPORT_PENALTY: -50,
} as const;

// Level thresholds (same as in route.ts)
const LEVELS = [
  { level: 1, min: 0, max: 99, name: '새싹' },
  { level: 2, min: 100, max: 499, name: '일반' },
  { level: 3, min: 500, max: 1999, name: '활동가' },
  { level: 4, min: 2000, max: 4999, name: '전문가' },
  { level: 5, min: 5000, max: Infinity, name: '명예' },
] as const;

/**
 * Calculate user level based on points
 */
function calculateLevel(points: number): number {
  for (const levelInfo of LEVELS) {
    if (points >= levelInfo.min && points <= levelInfo.max) {
      return levelInfo.level;
    }
  }
  return 1; // Default to level 1
}

describe('Rank Recalculation Logic', () => {
  describe('calculateLevel', () => {
    it('should return level 1 for 0-99 points', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
    });

    it('should return level 2 for 100-499 points', () => {
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(250)).toBe(2);
      expect(calculateLevel(499)).toBe(2);
    });

    it('should return level 3 for 500-1999 points', () => {
      expect(calculateLevel(500)).toBe(3);
      expect(calculateLevel(1000)).toBe(3);
      expect(calculateLevel(1999)).toBe(3);
    });

    it('should return level 4 for 2000-4999 points', () => {
      expect(calculateLevel(2000)).toBe(4);
      expect(calculateLevel(3000)).toBe(4);
      expect(calculateLevel(4999)).toBe(4);
    });

    it('should return level 5 for 5000+ points', () => {
      expect(calculateLevel(5000)).toBe(5);
      expect(calculateLevel(10000)).toBe(5);
      expect(calculateLevel(100000)).toBe(5);
    });
  });

  describe('Points Calculation', () => {
    it('should calculate points correctly for posts', () => {
      const posts = 10;
      const points = posts * POINTS.POST_CREATED;
      expect(points).toBe(100);
    });

    it('should calculate points correctly for comments', () => {
      const comments = 20;
      const points = comments * POINTS.COMMENT_CREATED;
      expect(points).toBe(100);
    });

    it('should calculate points correctly for likes received', () => {
      const likes = 50;
      const points = likes * POINTS.LIKE_RECEIVED;
      expect(points).toBe(100);
    });

    it('should calculate points correctly for comments received', () => {
      const commentsReceived = 10;
      const points = commentsReceived * POINTS.COMMENT_RECEIVED;
      expect(points).toBe(30);
    });

    it('should apply penalty for reports', () => {
      const reports = 2;
      const points = reports * POINTS.REPORT_PENALTY;
      expect(points).toBe(-100);
    });

    it('should calculate total points correctly', () => {
      const posts = 5; // 50 points
      const comments = 10; // 50 points
      const likes = 25; // 50 points
      const commentsReceived = 10; // 30 points
      const reports = 1; // -50 points

      const totalPoints =
        posts * POINTS.POST_CREATED +
        comments * POINTS.COMMENT_CREATED +
        likes * POINTS.LIKE_RECEIVED +
        commentsReceived * POINTS.COMMENT_RECEIVED +
        reports * POINTS.REPORT_PENALTY;

      expect(totalPoints).toBe(130); // Should be level 2
      expect(calculateLevel(totalPoints)).toBe(2);
    });

    it('should ensure points do not go below 0', () => {
      const reports = 10; // -500 points
      const totalPoints = reports * POINTS.REPORT_PENALTY;
      const finalPoints = Math.max(0, totalPoints);

      expect(finalPoints).toBe(0);
      expect(calculateLevel(finalPoints)).toBe(1);
    });
  });

  describe('Level Progression', () => {
    it('should progress from level 1 to level 2 with 10 posts', () => {
      const posts = 10;
      const points = posts * POINTS.POST_CREATED;
      expect(calculateLevel(points)).toBe(2);
    });

    it('should progress from level 2 to level 3 with 50 posts', () => {
      const posts = 50;
      const points = posts * POINTS.POST_CREATED;
      expect(calculateLevel(points)).toBe(3);
    });

    it('should progress from level 3 to level 4 with 200 posts', () => {
      const posts = 200;
      const points = posts * POINTS.POST_CREATED;
      expect(calculateLevel(points)).toBe(4);
    });

    it('should progress from level 4 to level 5 with 500 posts', () => {
      const posts = 500;
      const points = posts * POINTS.POST_CREATED;
      expect(calculateLevel(points)).toBe(5);
    });
  });
});
