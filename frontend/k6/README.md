# K6 Performance Load Tests - P4T4

## Overview

This directory contains K6 performance and load tests for the PoliticianFinder application. Tests are designed to validate performance under various load scenarios.

## Test Files

### 1. `load-test-basic.js`
**Basic Load Test** - Tests normal application usage patterns
- **Duration:** ~4 minutes
- **Max Users:** 20 concurrent users
- **Purpose:** Baseline performance validation
- **Thresholds:**
  - 95% of requests < 2s
  - Error rate < 5%

### 2. `load-test-stress.js`
**Stress Test** - Pushes application to find breaking point
- **Duration:** ~9 minutes
- **Max Users:** 150 concurrent users
- **Purpose:** Identify performance degradation and system limits
- **Thresholds:**
  - 95% of requests < 5s
  - Error rate < 10%

### 3. `load-test-spike.js`
**Spike Test** - Tests sudden traffic spike handling
- **Duration:** ~3 minutes
- **Max Users:** 200 concurrent users (spike)
- **Purpose:** Validate auto-scaling and spike resilience
- **Thresholds:**
  - 95% of requests < 10s during spike
  - Error rate < 20% during spike

## Installation

### Install K6

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6:latest
```

## Running Tests

### Basic Load Test
```bash
k6 run load-test-basic.js

# With custom base URL
k6 run -e BASE_URL=https://your-app.vercel.app load-test-basic.js
```

### Stress Test
```bash
k6 run load-test-stress.js

# With output to InfluxDB (if configured)
k6 run --out influxdb=http://localhost:8086/k6 load-test-stress.js
```

### Spike Test
```bash
k6 run load-test-spike.js

# With JSON output
k6 run --out json=results.json load-test-spike.js
```

### Using Docker
```bash
docker run --rm -i grafana/k6 run - <load-test-basic.js
```

## Test Against Different Environments

```bash
# Local development
k6 run -e BASE_URL=http://localhost:3000 load-test-basic.js

# Staging
k6 run -e BASE_URL=https://staging.example.com load-test-basic.js

# Production (use with caution!)
k6 run -e BASE_URL=https://production.example.com load-test-basic.js
```

## Interpreting Results

### Key Metrics

1. **Response Time (http_req_duration)**
   - Average: Mean response time
   - p(95): 95th percentile - 95% of requests are faster than this
   - p(99): 99th percentile - 99% of requests are faster than this
   - Max: Worst case response time

2. **Error Rate (http_req_failed)**
   - Percentage of failed requests (4xx, 5xx status codes)
   - Should stay below threshold during normal operation

3. **Throughput (http_reqs)**
   - Requests per second the system can handle
   - Higher is better

4. **Checks**
   - Percentage of successful validations
   - Should be close to 100%

### Success Criteria

**Basic Load Test:**
- ✓ p(95) < 2000ms
- ✓ Error rate < 5%
- ✓ All checks pass

**Stress Test:**
- ✓ p(95) < 5000ms under heavy load
- ✓ Error rate < 10%
- ✓ System recovers after load reduction

**Spike Test:**
- ✓ System remains responsive during spike
- ✓ Error rate < 20% during spike
- ✓ Full recovery after spike

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run Basic Load Test
        run: k6 run -e BASE_URL=${{ secrets.APP_URL }} k6/load-test-basic.js

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: summary.json
```

## Advanced Usage

### Custom Scenarios
You can modify the test files to add custom scenarios:

```javascript
export const options = {
  scenarios: {
    search_heavy: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      exec: 'searchScenario',
    },
    normal_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 20 },
      ],
      exec: 'browsingScenario',
    },
  },
};
```

### Monitoring with Grafana

1. Set up InfluxDB
2. Configure K6 output: `k6 run --out influxdb=http://localhost:8086/k6 test.js`
3. Create Grafana dashboard to visualize metrics in real-time

## Troubleshooting

**Connection refused errors:**
- Ensure the application is running on the specified BASE_URL
- Check firewall settings

**High error rates:**
- Verify application can handle the load
- Check database connection limits
- Review server resources (CPU, memory)

**Inconsistent results:**
- Run tests multiple times
- Ensure no other load on the system
- Check network stability

## Best Practices

1. **Baseline First:** Always run basic load test before stress/spike tests
2. **Monitor Resources:** Watch CPU, memory, and database metrics during tests
3. **Gradual Ramp:** Don't spike to max load immediately
4. **Production Caution:** Be very careful running load tests against production
5. **Regular Testing:** Run performance tests regularly, not just before release

## References

- [K6 Documentation](https://k6.io/docs/)
- [K6 Test Types](https://k6.io/docs/test-types/)
- [Performance Testing Guidance](https://k6.io/docs/testing-guides/)
