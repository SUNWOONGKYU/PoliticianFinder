import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * P4T4: Performance Load Tests - Spike Test
 * Tests how the application handles sudden traffic spikes
 */

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulRequests = new Counter('successful_requests');

// Spike test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 200 },  // Sudden spike!
    { duration: '1m', target: 200 },   // Sustain spike
    { duration: '10s', target: 10 },   // Drop back down
    { duration: '30s', target: 10 },   // Recovery period
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // Allow up to 10s during spike
    http_req_failed: ['rate<0.2'],      // Allow up to 20% errors during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const startTime = Date.now();

  // Critical path: Homepage -> Politicians List -> Search
  const results = {
    homepage: testPage(`${BASE_URL}/`, 'homepage'),
    politicians: testPage(`${BASE_URL}/politicians`, 'politicians'),
    search: testAPI(`${BASE_URL}/api/politicians/search?q=test&limit=10`, 'search'),
  };

  // Track overall success
  const allSuccessful = Object.values(results).every(r => r);
  if (allSuccessful) {
    successfulRequests.add(1);
  }

  const duration = Date.now() - startTime;
  responseTime.add(duration);

  sleep(0.5); // Minimal sleep for spike test
}

function testPage(url, name) {
  const response = http.get(url);

  const success = check(response, {
    [`${name} status ok`]: (r) => r.status === 200 || r.status === 304,
    [`${name} responds`]: (r) => r.body.length > 0,
  });

  errorRate.add(!success);
  return success;
}

function testAPI(url, name) {
  const response = http.get(url, {
    headers: { 'Accept': 'application/json' },
  });

  const success = check(response, {
    [`${name} API ok`]: (r) => r.status === 200,
    [`${name} API returns JSON`]: (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
  return success;
}

export function handleSummary(data) {
  console.log('\n=== SPIKE TEST SUMMARY ===\n');

  const httpDuration = data.metrics.http_req_duration;
  if (httpDuration) {
    console.log('Response Times During Spike:');
    console.log(`  Average: ${httpDuration.values.avg.toFixed(2)}ms`);
    console.log(`  Median: ${httpDuration.values.med.toFixed(2)}ms`);
    console.log(`  p(90): ${httpDuration.values['p(90)'].toFixed(2)}ms`);
    console.log(`  p(95): ${httpDuration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  p(99): ${httpDuration.values['p(99)'].toFixed(2)}ms`);
    console.log(`  Max: ${httpDuration.values.max.toFixed(2)}ms\n`);
  }

  const httpReqs = data.metrics.http_reqs;
  if (httpReqs) {
    console.log(`Total Requests: ${httpReqs.values.count}`);
    console.log(`Peak Requests/sec: ${httpReqs.values.rate.toFixed(2)}\n`);
  }

  const failed = data.metrics.http_req_failed;
  if (failed) {
    const errorPercentage = (failed.values.rate * 100).toFixed(2);
    console.log(`Error Rate: ${errorPercentage}%`);

    if (errorPercentage < 5) {
      console.log('✓ Excellent spike handling!\n');
    } else if (errorPercentage < 15) {
      console.log('✓ Good spike handling\n');
    } else if (errorPercentage < 25) {
      console.log('⚠ Acceptable spike handling\n');
    } else {
      console.log('✗ Poor spike handling - needs optimization\n');
    }
  }

  const checks = data.metrics.checks;
  if (checks) {
    console.log(`Overall Success Rate: ${(checks.values.rate * 100).toFixed(2)}%\n`);
  }

  // VU stats
  console.log('Virtual Users:');
  console.log(`  Peak: ${data.state.testRunDurationMs ? '200' : 'N/A'}`);
  console.log(`  Average: ${data.metrics.vus?.values?.avg?.toFixed(0) || 'N/A'}\n`);

  return {
    'spike-test-summary.json': JSON.stringify(data, null, 2),
  };
}
