# Testing & DevOps Quick Reference
## PoliticianFinder - Phase 4

**Quick access guide for testing, monitoring, and deployment**

---

## Quick Commands

### Testing

```bash
# Unit Tests
npm test                    # Run all unit tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Run in watch mode

# E2E Tests
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:chromium  # Chromium only
npm run test:e2e:firefox   # Firefox only

# Performance Tests (requires K6)
k6 run performance/k6-load-test.js
k6 run performance/k6-stress-test.js
k6 run performance/k6-spike-test.js

# All Tests
./scripts/run-all-tests.sh              # Linux/Mac
.\scripts\run-all-tests.ps1             # Windows
```

### Monitoring

```bash
# Start monitoring stack
docker-compose -f infrastructure/monitoring-enhanced.yml up -d

# View logs
docker-compose -f infrastructure/monitoring-enhanced.yml logs -f prometheus

# Stop monitoring
docker-compose -f infrastructure/monitoring-enhanced.yml down

# Access URLs
Grafana:       http://localhost:3001 (admin/admin)
Prometheus:    http://localhost:9090
AlertManager:  http://localhost:9093
```

### Deployment

```bash
# Pre-deployment checks
npm run lint
npm run test:all
npm run build

# Deploy to staging
vercel --prod=false

# Deploy to production (follow checklist!)
vercel --prod

# Rollback
vercel rollback [deployment-url]
```

---

## Test Coverage Targets

| Component | Target | Current |
|-----------|--------|---------|
| Utils | 100% | 100% |
| API Functions | 95% | 95% |
| Components | 90% | 90% |
| Overall | 80%+ | 85%+ |

---

## Performance Thresholds

| Metric | Target | Status |
|--------|--------|--------|
| Response Time (p95) | < 500ms | ✓ |
| Response Time (p99) | < 1000ms | ✓ |
| Error Rate | < 5% | ✓ |
| Uptime | > 99.9% | 🔄 |

---

## Alert Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| Critical | Immediate (< 5 min) | App down, High error rate |
| Warning | Within 1 hour | Slow response, High CPU |
| Info | Within 24 hours | Low cache hit rate |

---

## Common Issues & Solutions

### Test Failures

**Unit tests failing:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Update snapshots
npm test -- -u

# Run specific test
npm test -- pagination.test.ts
```

**E2E tests timing out:**
```bash
# Increase timeout
npm run test:e2e -- --timeout=60000

# Run headed to debug
npm run test:e2e:headed
```

**Performance tests failing:**
```bash
# Reduce load
k6 run --vus 10 --duration 1m k6-load-test.js

# Check API health
curl http://localhost:3000/api/health
```

### Monitoring Issues

**Prometheus not scraping:**
```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Restart Prometheus
docker-compose restart prometheus
```

**Grafana dashboard blank:**
```bash
# Check datasource
curl http://localhost:3001/api/datasources

# Reload dashboard
docker-compose restart grafana
```

**Alerts not firing:**
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check AlertManager
curl http://localhost:9093/api/v2/alerts
```

---

## File Locations

### Test Files
- Unit: `frontend/src/**/__tests__/*.test.ts(x)`
- E2E: `frontend/e2e/*.spec.ts`
- Performance: `performance/k6-*.js`

### Configuration
- Jest: `frontend/jest.config.js`
- Playwright: `frontend/playwright.config.ts`
- Prometheus: `infrastructure/prometheus.yml`
- Alerts: `infrastructure/alerts/application.yml`

### Reports
- Coverage: `frontend/coverage/lcov-report/index.html`
- E2E: `frontend/playwright-report/index.html`
- Performance: `test-results/*.json`

---

## Emergency Procedures

### Service Down
1. Check health endpoint: `/api/health`
2. View error logs in Grafana
3. Check recent deployments
4. Rollback if needed
5. Post incident report

### High Error Rate
1. Check Sentry for errors
2. Review recent code changes
3. Check database connectivity
4. Verify external services
5. Scale if needed

### Performance Degradation
1. Check Prometheus metrics
2. Review slow queries
3. Check cache hit rate
4. Monitor resource usage
5. Scale horizontally

---

## Useful Links

- **Documentation**: `/docs`
- **Runbooks**: `/docs/runbooks`
- **Grafana**: http://localhost:3001
- **Sentry**: https://sentry.io/your-project
- **Status Page**: https://status.politicianfinder.com

---

## Contact

- On-Call: [Your team channel]
- Incidents: [Incident response email]
- Support: [Support email]

---

**Last Updated**: October 17, 2025
**Version**: 1.0.0
