# Playwright E2E Tests Installation Guide

## Quick Installation

### 1. Install Playwright packages
```bash
cd frontend
npm install --save-dev @playwright/test playwright
```

### 2. Install browsers
```bash
npx playwright install
```

### 3. Verify installation
```bash
npx playwright --version
```

## Detailed Installation Steps

### Step 1: Install Node.js Dependencies

The project already has Playwright listed in `package.json`. Just run:

```bash
npm install
```

Or specifically install Playwright:

```bash
npm install --save-dev @playwright/test
```

### Step 2: Install Browser Binaries

Playwright requires browser binaries (Chromium, Firefox, WebKit):

```bash
# Install all browsers
npx playwright install

# Or install specific browsers
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### Step 3: Install System Dependencies (Linux/WSL only)

If you're on Linux or WSL, you may need system dependencies:

```bash
npx playwright install-deps
```

### Step 4: Verify Installation

Check that everything is installed correctly:

```bash
# Check Playwright version
npx playwright --version

# List available browsers
npx playwright install --list
```

## Running Your First Test

### Option 1: UI Mode (Recommended)
```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- See all tests
- Run individual tests
- Watch tests execute
- Debug failures

### Option 2: Command Line
```bash
npm run test:e2e
```

### Option 3: Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

## Common Installation Issues

### Issue 1: Permission Errors

**Windows:**
```bash
# Run as administrator
npm install --save-dev @playwright/test
```

**Linux/Mac:**
```bash
sudo npm install --save-dev @playwright/test
```

### Issue 2: Browser Download Fails

If browser download fails, try:
```bash
# Use direct download
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0 npx playwright install

# Or set a proxy
HTTP_PROXY=http://proxy.example.com:8080 npx playwright install
```

### Issue 3: Module Not Found

If you get "Cannot find module '@playwright/test'":
```bash
# Clean install
rm -rf node_modules
npm install
npx playwright install
```

### Issue 4: Port Already in Use

If port 3000 is already in use:
```bash
# Change port in playwright.config.ts
baseURL: 'http://localhost:3001'

# And start dev server on different port
PORT=3001 npm run dev
```

## Verification Checklist

- [ ] Node.js installed (v16 or higher)
- [ ] npm or yarn available
- [ ] @playwright/test installed
- [ ] Browser binaries installed
- [ ] Can run `npx playwright --version`
- [ ] Dev server can start on port 3000
- [ ] Can run `npm run test:e2e:ui`

## System Requirements

### Minimum Requirements
- **Node.js**: v16 or higher
- **RAM**: 4GB
- **Disk Space**: 2GB for browser binaries
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Recommended
- **Node.js**: v18 or higher
- **RAM**: 8GB
- **Disk Space**: 5GB
- **CPU**: Multi-core for parallel test execution

## Package Versions

Current configuration:
```json
{
  "@playwright/test": "^1.56.1",
  "playwright": "^1.56.1"
}
```

## Updating Playwright

To update to the latest version:
```bash
# Update packages
npm update @playwright/test playwright

# Update browsers
npx playwright install
```

## Uninstallation

If you need to uninstall:
```bash
# Remove packages
npm uninstall @playwright/test playwright

# Remove browser binaries
rm -rf ~/.cache/ms-playwright
```

## Docker Installation (Optional)

For CI/CD, use Playwright Docker image:
```dockerfile
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "run", "test:e2e"]
```

## Next Steps

After installation:

1. **Read the Quick Start Guide**: `e2e/QUICK_START.md`
2. **Run tests in UI mode**: `npm run test:e2e:ui`
3. **Check the documentation**: `e2e/README.md`
4. **Review test files**: `e2e/*.spec.ts`

## Support

If you encounter issues:

1. Check Playwright docs: https://playwright.dev/docs/intro
2. Check GitHub issues: https://github.com/microsoft/playwright/issues
3. Review our README: `e2e/README.md`

## Troubleshooting Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Playwright cache
rm -rf ~/.cache/ms-playwright
npx playwright install

# Run with debug logs
DEBUG=pw:api npm run test:e2e
```

## Environment Variables

You can customize installation:

```bash
# Skip browser download (install later)
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install

# Custom browser path
PLAYWRIGHT_BROWSERS_PATH=/custom/path npx playwright install

# Use specific Chromium revision
PLAYWRIGHT_CHROMIUM_REVISION=1000 npx playwright install chromium
```

## CI/CD Configuration

For GitHub Actions:
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: 18

- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm run test:e2e
```

## Success Indicators

You've successfully installed when:

✅ `npx playwright --version` shows version number
✅ `npm run test:e2e:ui` opens the UI
✅ Tests can run without errors
✅ Browsers launch correctly

## Installation Complete!

You're now ready to run E2E tests. Start with:

```bash
npm run test:e2e:ui
```

Happy testing!
