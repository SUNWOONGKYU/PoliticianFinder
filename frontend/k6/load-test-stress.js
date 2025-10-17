import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * P4T4: Performance Load Tests - Stress Test
 * Tests application performance under heavy load to find breaking point
 */

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Stress test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 150 },  // Push to 150 users
    { duration: '2m', target: 150 },  // Stay at 150 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% should be under 5s during stress
    http_req_failed: ['rate<0.1'],     // Allow up to 10% errors during stress
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const scenarios = [
    testHomepage,
    testPoliticiansList,
    testSearch,
    testAPIEndpoint,
  ];

  // Randomly execute one scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 3 + 1); // Random sleep 1-4s
}

function testHomepage() {
  const response = http.get(`${BASE_URL}/`);

  check(response, {
    'homepage accessible': (r) => r.status === 200,
  });

  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
}

function testPoliticiansList() {
  const page = Math.floor(Math.random() * 5) + 1;
  const response = http.get(`${BASE_URL}/politicians?page=${page}`);

  check(response, {
    'list accessible': (r) => r.status === 200,
  });

  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
}

function testSearch() {
  const queries = ['김', '이', '박', '최', '정'];
  const query = queries[Math.floor(Math.random() * queries.length)];

  const response = http.get(`${BASE_URL}/api/politicians/search?q=${query}&limit=10`);

  check(response, {
    'search works': (r) => r.status === 200,
  });

  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
}

function testAPIEndpoint() {
  const politicianId = Math.floor(Math.random() * 100) + 1;
  const response = http.get(`${BASE_URL}/api/politicians/${politicianId}`);

  check(response, {
    'API accessible': (r) => r.status === 200 || r.status === 404,
  });

  errorRate.add(response.status >= 500);
  responseTime.add(response.timings.duration);
}

export function handleSummary(data) {
  console.log('\n=== STRESS TEST SUMMARY ===\n');

  const httpDuration = data.metrics.http_req_duration;
  if (httpDuration) {
    console.log('Response Times:');
    console.log(`  Average: ${httpDuration.values.avg.toFixed(2)}ms`);
    console.log(`  p(95): ${httpDuration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  p(99): ${httpDuration.values['p(99)'].toFixed(2)}ms`);
    console.log(`  Max: ${httpDuration.values.max.toFixed(2)}ms\n`);
  }

  const httpReqs = data.metrics.http_reqs;
  if (httpReqs) {
    console.log(`Total Requests: ${httpReqs.values.count}`);
    console.log(`Requests/sec: ${httpReqs.values.rate.toFixed(2)}\n`);
  }

  const failed = data.metrics.http_req_failed;
  if (failed) {
    console.log(`Error Rate: ${(failed.values.rate * 100).toFixed(2)}%`);
    console.log(`Failed Requests: ${failed.values.fails}\n`);
  }

  const checks = data.metrics.checks;
  if (checks) {
    console.log(`Checks Passed: ${(checks.values.rate * 100).toFixed(2)}%\n`);
  }

  return {
    'stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
