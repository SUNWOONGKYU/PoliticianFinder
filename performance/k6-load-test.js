/**
 * P4T4: K6 Performance Load Testing Script
 *
 * Tests API performance under load
 * Measures response times, throughput, and error rates
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 50 },   // Ramp down to 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.05'],  // Error rate < 5%
    errors: ['rate<0.1'],            // Custom error rate < 10%
    api_response_time: ['p(95)<1000'], // 95% of API calls < 1000ms
  },
};

// Base URL - configure based on environment
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'Test123!' },
  { email: 'test2@example.com', password: 'Test123!' },
  { email: 'test3@example.com', password: 'Test123!' },
];

export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log(`Test duration: ~7 minutes`);
  console.log(`Max concurrent users: 100`);

  // Health check
  const healthCheck = http.get(`${BASE_URL}/api/health`);

  if (healthCheck.status !== 200) {
    console.error('Health check failed! Aborting test.');
    throw new Error('API is not healthy');
  }

  console.log('Health check passed. Starting load test...');
  return { startTime: Date.now() };
}

export default function (data) {
  // Simulate different user behaviors with weighted scenarios
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Browse politicians list
    browsePoliticians();
  } else if (scenario < 0.7) {
    // 30% - View politician details
    viewPoliticianDetails();
  } else if (scenario < 0.85) {
    // 15% - Search politicians
    searchPoliticians();
  } else {
    // 15% - Rate and comment
    rateAndComment();
  }

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

function browsePoliticians() {
  const page = Math.floor(Math.random() * 5) + 1;
  const limit = 20;

  const startTime = Date.now();
  const response = http.get(`${BASE_URL}/api/politicians?page=${page}&limit=${limit}`);
  const duration = Date.now() - startTime;

  apiResponseTime.add(duration);

  const success = check(response, {
    'browse: status is 200': (r) => r.status === 200,
    'browse: has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
    'browse: response time < 500ms': () => duration < 500,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

function viewPoliticianDetails() {
  const politicianId = Math.floor(Math.random() * 100) + 1;

  const startTime = Date.now();
  const response = http.get(`${BASE_URL}/api/politicians/${politicianId}`);
  const duration = Date.now() - startTime;

  apiResponseTime.add(duration);

  const success = check(response, {
    'detail: status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'detail: has politician data': (r) => {
      if (r.status === 404) return true;
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch {
        return false;
      }
    },
    'detail: response time < 700ms': () => duration < 700,
  });

  if (success) {
    successfulRequests.add(1);

    // Also fetch ratings for this politician
    if (response.status === 200) {
      const ratingsResponse = http.get(`${BASE_URL}/api/ratings?politician_id=${politicianId}`);
      check(ratingsResponse, {
        'ratings: status is 200': (r) => r.status === 200,
      });
    }
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

function searchPoliticians() {
  const searchTerms = ['김', '이', '박', '최', '정', 'seoul', 'busan'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

  const startTime = Date.now();
  const response = http.get(`${BASE_URL}/api/politicians/search?q=${encodeURIComponent(term)}`);
  const duration = Date.now() - startTime;

  apiResponseTime.add(duration);

  const success = check(response, {
    'search: status is 200': (r) => r.status === 200,
    'search: has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
    'search: response time < 800ms': () => duration < 800,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

function rateAndComment() {
  const politicianId = Math.floor(Math.random() * 100) + 1;
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Attempt to post a rating (may fail if not authenticated)
  const ratingData = {
    politician_id: politicianId,
    score: Math.floor(Math.random() * 5) + 1,
    comment: 'Load test comment ' + Date.now(),
    category: 'overall',
  };

  const startTime = Date.now();
  const response = http.post(
    `${BASE_URL}/api/ratings`,
    JSON.stringify(ratingData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const duration = Date.now() - startTime;

  apiResponseTime.add(duration);

  // Accept 200, 201, 401 (unauthorized) as valid responses
  const success = check(response, {
    'rating: status is valid': (r) => [200, 201, 401, 403].includes(r.status),
    'rating: response time < 1000ms': () => duration < 1000,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\nLoad test completed in ${duration.toFixed(2)} seconds`);
  console.log('Check the summary above for detailed metrics.');
}

export function handleSummary(data) {
  return {
    'performance-report.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const metrics = data.metrics;

  let summary = '\n' + indent + '=== PERFORMANCE TEST SUMMARY ===\n\n';

  // HTTP metrics
  summary += indent + 'HTTP Metrics:\n';
  summary += indent + `  Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += indent + `  Failed Requests: ${metrics.http_req_failed?.values?.rate ? (metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%\n`;
  summary += indent + `  Request Duration (avg): ${metrics.http_req_duration?.values?.avg?.toFixed(2) || 0}ms\n`;
  summary += indent + `  Request Duration (p95): ${metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0}ms\n`;
  summary += indent + `  Request Duration (p99): ${metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 0}ms\n\n`;

  // Custom metrics
  summary += indent + 'Custom Metrics:\n';
  summary += indent + `  Successful Requests: ${metrics.successful_requests?.values?.count || 0}\n`;
  summary += indent + `  Failed Requests: ${metrics.failed_requests?.values?.count || 0}\n`;
  summary += indent + `  Error Rate: ${metrics.errors?.values?.rate ? (metrics.errors.values.rate * 100).toFixed(2) : 0}%\n`;
  summary += indent + `  API Response Time (avg): ${metrics.api_response_time?.values?.avg?.toFixed(2) || 0}ms\n`;
  summary += indent + `  API Response Time (p95): ${metrics.api_response_time?.values?.['p(95)']?.toFixed(2) || 0}ms\n\n`;

  // Thresholds
  summary += indent + 'Threshold Status:\n';
  const thresholds = data.root_group?.checks || [];
  thresholds.forEach(check => {
    const status = check.passes === check.count ? '✓' : '✗';
    summary += indent + `  ${status} ${check.name}: ${check.passes}/${check.count}\n`;
  });

  summary += '\n' + indent + '=================================\n';

  return summary;
}
