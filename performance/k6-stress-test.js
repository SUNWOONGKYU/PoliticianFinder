/**
 * P4T4: K6 Stress Testing Script
 *
 * Tests system behavior under extreme load
 * Identifies breaking points and recovery capabilities
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Warm up
    { duration: '2m', target: 200 },   // Stress level 1
    { duration: '2m', target: 500 },   // Stress level 2
    { duration: '2m', target: 1000 },  // Extreme stress
    { duration: '1m', target: 500 },   // Recovery test 1
    { duration: '1m', target: 200 },   // Recovery test 2
    { duration: '1m', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'], // 99% should complete within 5s even under stress
    http_req_failed: ['rate<0.2'],     // Allow up to 20% error rate under stress
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/politicians?page=1&limit=20`],
    ['GET', `${BASE_URL}/api/politicians/1`],
    ['GET', `${BASE_URL}/api/ratings?politician_id=1`],
    ['GET', `${BASE_URL}/api/health`],
  ]);

  responses.forEach((response) => {
    const success = check(response, {
      'status is 200 or 503': (r) => r.status === 200 || r.status === 503,
      'response time < 5000ms': (r) => r.timings.duration < 5000,
    });

    responseTime.add(response.timings.duration);
    errorRate.add(!success);
  });

  sleep(0.5); // Minimal sleep for stress testing
}
