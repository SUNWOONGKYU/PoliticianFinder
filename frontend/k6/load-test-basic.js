import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * P4T4: Performance Load Tests - Basic Load Test
 * Tests basic application performance under normal load
 */

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Homepage
  let response = http.get(`${BASE_URL}/`);

  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  requestCount.add(1);

  sleep(1);

  // Test 2: Politicians List
  response = http.get(`${BASE_URL}/politicians`);

  check(response, {
    'politicians list status is 200': (r) => r.status === 200,
    'politicians list loads in <3s': (r) => r.timings.duration < 3000,
    'politicians list has content': (r) => r.body.length > 0,
  });

  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  requestCount.add(1);

  sleep(2);

  // Test 3: Search API
  response = http.get(`${BASE_URL}/api/politicians/search?q=김&page=1&limit=10`);

  check(response, {
    'search API status is 200': (r) => r.status === 200,
    'search API responds in <1s': (r) => r.timings.duration < 1000,
    'search API returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  });

  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  requestCount.add(1);

  sleep(1);

  // Test 4: Politician Detail (if available)
  response = http.get(`${BASE_URL}/politicians/1`);

  check(response, {
    'detail page status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'detail page loads in <2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(response.status >= 500);
  responseTime.add(response.timings.duration);
  requestCount.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Performance Test Summary\n${indent}${'='.repeat(50)}\n\n`;

  // HTTP metrics
  const httpMetrics = data.metrics.http_req_duration;
  if (httpMetrics) {
    summary += `${indent}Response Time:\n`;
    summary += `${indent}  Average: ${httpMetrics.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  Min: ${httpMetrics.values.min.toFixed(2)}ms\n`;
    summary += `${indent}  Max: ${httpMetrics.values.max.toFixed(2)}ms\n`;
    summary += `${indent}  p(95): ${httpMetrics.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  // Request count
  const reqCount = data.metrics.http_reqs;
  if (reqCount) {
    summary += `${indent}Total Requests: ${reqCount.values.count}\n`;
    summary += `${indent}Requests/sec: ${reqCount.values.rate.toFixed(2)}\n\n`;
  }

  // Error rate
  const errorMetric = data.metrics.http_req_failed;
  if (errorMetric) {
    summary += `${indent}Error Rate: ${(errorMetric.values.rate * 100).toFixed(2)}%\n\n`;
  }

  // Check results
  const checks = data.metrics.checks;
  if (checks) {
    const passRate = checks.values.rate * 100;
    summary += `${indent}Checks Passed: ${passRate.toFixed(2)}%\n\n`;
  }

  summary += `${indent}${'='.repeat(50)}\n`;

  return summary;
}
