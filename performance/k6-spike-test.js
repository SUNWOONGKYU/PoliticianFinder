/**
 * P4T4: K6 Spike Testing Script
 *
 * Tests system behavior under sudden traffic spikes
 * Simulates viral events or DDoS scenarios
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Normal load
    { duration: '10s', target: 1000 },  // Sudden spike
    { duration: '1m', target: 1000 },   // Sustained spike
    { duration: '10s', target: 50 },    // Quick recovery
    { duration: '30s', target: 50 },    // Observe recovery
    { duration: '10s', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.25'], // Allow 25% failure during spike
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const response = http.get(`${BASE_URL}/api/politicians?page=1&limit=10`);

  check(response, {
    'status is valid': (r) => [200, 429, 503].includes(r.status),
    'has response': (r) => r.body.length > 0,
  });

  sleep(0.1); // Minimal sleep to maximize spike
}
