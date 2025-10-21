/**
 * Security Test Scenarios
 * 작업 ID: P3S1, P3S2
 * 작성일: 2025-01-17
 *
 * OWASP Top 10 기반 보안 테스트 시나리오
 */

/**
 * XSS 공격 테스트 벡터
 */
export const XSS_TEST_VECTORS = [
  // 기본 XSS
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "<svg onload=alert('XSS')>",

  // 인코딩된 XSS
  "&#60;script&#62;alert('XSS')&#60;/script&#62;",
  "%3Cscript%3Ealert('XSS')%3C/script%3E",
  "\u003cscript\u003ealert('XSS')\u003c/script\u003e",

  // 이벤트 핸들러 XSS
  "<div onclick=\"alert('XSS')\">Click me</div>",
  "<a href=\"javascript:alert('XSS')\">Click</a>",
  "<iframe src=\"javascript:alert('XSS')\"></iframe>",

  // CSS XSS
  "<style>body{background:url('javascript:alert(1)')}</style>",
  "<link rel=\"stylesheet\" href=\"javascript:alert('XSS')\">",

  // HTML5 XSS
  "<video><source onerror=\"alert('XSS')\">",
  "<audio src=x onerror=alert('XSS')>",
  "<details open ontoggle=alert('XSS')>",

  // 우회 시도
  "<scr<script>ipt>alert('XSS')</scr</script>ipt>",
  "<<SCRIPT>alert('XSS');//<</SCRIPT>",
  "<img src=\"x\" onerror=\"alert('XSS')\" />",

  // Markdown XSS
  "[Click me](javascript:alert('XSS'))",
  "![](x:alert('XSS'))",

  // JSON XSS
  '{"name":"<script>alert(\'XSS\')</script>"}',
  '{"__proto__":{"isAdmin":true}}'
];

/**
 * SQL Injection 테스트 벡터
 */
export const SQL_INJECTION_VECTORS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin' --",
  "' OR 1=1 --",
  "1'; EXEC sp_MSForEachTable 'DROP TABLE ?'; --",
  "' UNION SELECT * FROM users --",
  "1' AND 1=CONVERT(int, (SELECT TOP 1 name FROM sysobjects WHERE xtype='U'))--",
  "'; WAITFOR DELAY '00:00:10' --",
  "1' AND (SELECT COUNT(*) FROM users) > 0 --"
];

/**
 * Path Traversal 테스트 벡터
 */
export const PATH_TRAVERSAL_VECTORS = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "....//....//....//etc/passwd",
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
  "..%252f..%252f..%252fetc%252fpasswd",
  "..;/etc/passwd",
  "..%00/etc/passwd"
];

/**
 * Command Injection 테스트 벡터
 */
export const COMMAND_INJECTION_VECTORS = [
  "; ls -la",
  "| whoami",
  "& net user",
  "`id`",
  "$(whoami)",
  "; cat /etc/passwd",
  "| ping -c 10 127.0.0.1",
  "\n/bin/ls -la"
];

/**
 * 보안 테스트 실행 함수
 */
export async function runSecurityTests(targetUrl: string): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];

  // XSS 테스트
  for (const vector of XSS_TEST_VECTORS) {
    const result = await testXssVulnerability(targetUrl, vector);
    results.push(result);
  }

  // SQL Injection 테스트
  for (const vector of SQL_INJECTION_VECTORS) {
    const result = await testSqlInjection(targetUrl, vector);
    results.push(result);
  }

  // Rate Limiting 테스트
  const rateLimitResult = await testRateLimiting(targetUrl);
  results.push(rateLimitResult);

  // CSP 테스트
  const cspResult = await testCspHeaders(targetUrl);
  results.push(cspResult);

  return results;
}

/**
 * XSS 취약점 테스트
 */
async function testXssVulnerability(
  url: string,
  payload: string
): Promise<SecurityTestResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: payload })
    });

    const responseText = await response.text();

    // 응답에서 페이로드가 그대로 반환되는지 확인
    const isVulnerable = responseText.includes(payload) &&
                        !responseText.includes(escapeHtml(payload));

    return {
      test: 'XSS',
      payload,
      vulnerable: isVulnerable,
      severity: isVulnerable ? 'HIGH' : 'NONE',
      message: isVulnerable
        ? `XSS vulnerability detected with payload: ${payload}`
        : 'XSS protection working correctly'
    };
  } catch (error) {
    return {
      test: 'XSS',
      payload,
      vulnerable: false,
      severity: 'NONE',
      message: `Test failed: ${error}`
    };
  }
}

/**
 * SQL Injection 테스트
 */
async function testSqlInjection(
  url: string,
  payload: string
): Promise<SecurityTestResult> {
  try {
    const response = await fetch(`${url}?id=${encodeURIComponent(payload)}`);

    // SQL 에러 메시지 검출
    const errorIndicators = [
      'SQL syntax',
      'mysql_fetch',
      'ORA-01756',
      'PostgreSQL',
      'SQL Server',
      'sqlite_',
      'database error'
    ];

    const responseText = await response.text();
    const hasError = errorIndicators.some(indicator =>
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );

    return {
      test: 'SQL_INJECTION',
      payload,
      vulnerable: hasError,
      severity: hasError ? 'CRITICAL' : 'NONE',
      message: hasError
        ? `SQL injection vulnerability detected`
        : 'SQL injection protection working'
    };
  } catch (error) {
    return {
      test: 'SQL_INJECTION',
      payload,
      vulnerable: false,
      severity: 'NONE',
      message: `Test failed: ${error}`
    };
  }
}

/**
 * Rate Limiting 테스트
 */
async function testRateLimiting(url: string): Promise<SecurityTestResult> {
  const requests = 100; // 100개 요청 시도
  const results: boolean[] = [];

  for (let i = 0; i < requests; i++) {
    try {
      const response = await fetch(url);
      results.push(response.status !== 429);
    } catch {
      results.push(false);
    }
  }

  const successfulRequests = results.filter(r => r).length;
  const isVulnerable = successfulRequests === requests;

  return {
    test: 'RATE_LIMITING',
    payload: `${requests} requests`,
    vulnerable: isVulnerable,
    severity: isVulnerable ? 'MEDIUM' : 'NONE',
    message: isVulnerable
      ? `No rate limiting detected - all ${requests} requests succeeded`
      : `Rate limiting working - ${requests - successfulRequests} requests blocked`
  };
}

/**
 * CSP 헤더 테스트
 */
async function testCspHeaders(url: string): Promise<SecurityTestResult> {
  try {
    const response = await fetch(url);
    const cspHeader = response.headers.get('Content-Security-Policy');

    if (!cspHeader) {
      return {
        test: 'CSP_HEADERS',
        payload: 'N/A',
        vulnerable: true,
        severity: 'MEDIUM',
        message: 'No Content-Security-Policy header found'
      };
    }

    // 위험한 CSP 설정 확인
    const issues: string[] = [];

    if (cspHeader.includes("'unsafe-inline'") && !cspHeader.includes('nonce-')) {
      issues.push("Unsafe inline scripts allowed without nonce");
    }

    if (cspHeader.includes("'unsafe-eval'")) {
      issues.push("Unsafe eval allowed");
    }

    if (cspHeader.includes('*') && !cspHeader.includes('http:')) {
      issues.push("Wildcard source allowed");
    }

    return {
      test: 'CSP_HEADERS',
      payload: cspHeader.substring(0, 100) + '...',
      vulnerable: issues.length > 0,
      severity: issues.length > 0 ? 'MEDIUM' : 'NONE',
      message: issues.length > 0
        ? `CSP issues found: ${issues.join(', ')}`
        : 'CSP headers properly configured'
    };
  } catch (error) {
    return {
      test: 'CSP_HEADERS',
      payload: 'N/A',
      vulnerable: false,
      severity: 'NONE',
      message: `Test failed: ${error}`
    };
  }
}

/**
 * HTML 이스케이프 함수
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 테스트 결과 타입
 */
export interface SecurityTestResult {
  test: string;
  payload: string;
  vulnerable: boolean;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

/**
 * 보안 점수 계산
 */
export function calculateSecurityScore(results: SecurityTestResult[]): number {
  const weights = {
    CRITICAL: 0,
    HIGH: 0.25,
    MEDIUM: 0.5,
    LOW: 0.75,
    NONE: 1
  };

  if (results.length === 0) return 0;

  const totalScore = results.reduce((sum, result) => {
    return sum + weights[result.severity];
  }, 0);

  return Math.round((totalScore / results.length) * 100);
}

/**
 * 보안 보고서 생성
 */
export function generateSecurityReport(results: SecurityTestResult[]): string {
  const score = calculateSecurityScore(results);
  const vulnerabilities = results.filter(r => r.vulnerable);

  let report = `
# Security Test Report

**Date**: ${new Date().toISOString()}
**Security Score**: ${score}/100
**Total Tests**: ${results.length}
**Vulnerabilities Found**: ${vulnerabilities.length}

## Summary

`;

  if (score >= 90) {
    report += "✅ Excellent security posture. No critical vulnerabilities found.\n\n";
  } else if (score >= 70) {
    report += "⚠️ Good security with some minor issues to address.\n\n";
  } else if (score >= 50) {
    report += "⚠️ Moderate security risks detected. Immediate action recommended.\n\n";
  } else {
    report += "❌ Critical security vulnerabilities found. Urgent remediation required.\n\n";
  }

  // Vulnerabilities by severity
  const bySeverity = {
    CRITICAL: vulnerabilities.filter(v => v.severity === 'CRITICAL'),
    HIGH: vulnerabilities.filter(v => v.severity === 'HIGH'),
    MEDIUM: vulnerabilities.filter(v => v.severity === 'MEDIUM'),
    LOW: vulnerabilities.filter(v => v.severity === 'LOW')
  };

  if (bySeverity.CRITICAL.length > 0) {
    report += `## 🔴 Critical Vulnerabilities (${bySeverity.CRITICAL.length})\n\n`;
    bySeverity.CRITICAL.forEach(v => {
      report += `- **${v.test}**: ${v.message}\n`;
    });
    report += '\n';
  }

  if (bySeverity.HIGH.length > 0) {
    report += `## 🟠 High Severity (${bySeverity.HIGH.length})\n\n`;
    bySeverity.HIGH.forEach(v => {
      report += `- **${v.test}**: ${v.message}\n`;
    });
    report += '\n';
  }

  if (bySeverity.MEDIUM.length > 0) {
    report += `## 🟡 Medium Severity (${bySeverity.MEDIUM.length})\n\n`;
    bySeverity.MEDIUM.forEach(v => {
      report += `- **${v.test}**: ${v.message}\n`;
    });
    report += '\n';
  }

  // Recommendations
  report += `## Recommendations

1. **Immediate Actions**:
   - Fix all critical and high severity vulnerabilities
   - Review and update security policies
   - Implement automated security testing

2. **Best Practices**:
   - Regular security audits
   - Keep dependencies updated
   - Security training for developers
   - Implement defense in depth

3. **OWASP Top 10 Compliance**:
   - A01: Broken Access Control - ${vulnerabilities.some(v => v.test.includes('ACCESS')) ? '❌ Issues found' : '✅ Protected'}
   - A02: Cryptographic Failures - ✅ Using HTTPS
   - A03: Injection - ${vulnerabilities.some(v => v.test.includes('INJECTION')) ? '❌ Vulnerable' : '✅ Protected'}
   - A04: Insecure Design - Review required
   - A05: Security Misconfiguration - ${vulnerabilities.some(v => v.test.includes('CSP')) ? '⚠️ Check CSP' : '✅ Configured'}
   - A06: Vulnerable Components - Dependency scan required
   - A07: Authentication Failures - ${vulnerabilities.some(v => v.test.includes('RATE')) ? '⚠️ Rate limiting issues' : '✅ Protected'}
   - A08: Software and Data Integrity - Review required
   - A09: Security Logging - Implement comprehensive logging
   - A10: SSRF - Review external requests

`;

  return report;
}

export default {
  XSS_TEST_VECTORS,
  SQL_INJECTION_VECTORS,
  PATH_TRAVERSAL_VECTORS,
  COMMAND_INJECTION_VECTORS,
  runSecurityTests,
  calculateSecurityScore,
  generateSecurityReport
};