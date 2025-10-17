/**
 * Bundle Analyzer Configuration
 * P4F1: Frontend Performance Optimization
 *
 * Analyze webpack bundle size and composition
 * Usage: npm run build:analyze
 */

module.exports = {
  enabled: process.env.ANALYZE === 'true',
  bundleAnalyzerConfig: {
    analyzerMode: 'static',
    reportFilename: './bundle-analyzer-report.html',
    openAnalyzer: true,
    generateStatsFile: true,
    statsFilename: './bundle-stats.json',
    logLevel: 'info',
  },
};
