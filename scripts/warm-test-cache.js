#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Warm up node_modules cache
console.log('Warming up node_modules cache...');
execSync('find node_modules -type f -name "*.js" -print0 | xargs -0 cat > /dev/null', {
  stdio: 'inherit'
});

// Pre-compile test files
console.log('\nPre-compiling test files...');
const testFiles = execSync('find e2e -name "*.spec.ts"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

testFiles.forEach(file => {
  try {
    execSync(`tsc ${file} --noEmit`, { stdio: 'inherit' });
  } catch (e) {
    // Ignore compilation errors, just warming the cache
  }
});

// Pre-load browser binaries
console.log('\nPre-loading browser binaries...');
execSync('npx playwright install chromium', { stdio: 'inherit' });

// Create RAM disk for temp files if possible
console.log('\nSetting up RAM disk for temp files...');
try {
  if (process.platform === 'darwin') {
    const ramDiskSize = 512; // MB
    const mountPoint = '/private/var/tmp/playwright-ram';
    
    execSync(`
      diskutil erasevolume HFS+ "PlaywrightRAM" \`hdiutil attach -nomount ram://$((${ramDiskSize} * 2048))\`
      mkdir -p ${mountPoint}
      mount -t hfs /dev/disk$(hdiutil info | grep "PlaywrightRAM" | cut -d' ' -f1) ${mountPoint}
    `, { stdio: 'inherit' });
    
    console.log(`RAM disk mounted at ${mountPoint}`);
  }
} catch (e) {
  console.log('Could not create RAM disk, falling back to regular temp directory');
}

// Pre-create necessary directories
console.log('\nPre-creating test directories...');
[
  'test-results',
  'test-results/screenshots',
  'playwright-report',
  'test-results/traces'
].forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

console.log('\nCache warming complete! 🚀');
