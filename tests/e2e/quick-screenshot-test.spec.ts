import { test, expect } from '@playwright/test';

test('Capture all UI screenshots', async ({ page }) => {
  console.log('\n🎬 Starting UI Screenshot Capture\n');
  
  // Homepage
  console.log('✓ Step 1: Homepage');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/ui-screenshots/01-homepage.png', fullPage: true });
  
  // Login page
  console.log('✓ Step 2: Login Page');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/ui-screenshots/02-login-page.png', fullPage: true });
  
  // Login as Super Admin
  console.log('✓ Step 3: Admin Login');
  await page.fill('input[placeholder="admin@compliant.com"]', 'miriamsabel@insuretrack.onmicrosoft.com');
  await page.fill('input[type="password"]', '260Hooper');
  await page.screenshot({ path: '/tmp/ui-screenshots/03-login-filled.png', fullPage: true });
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/ui-screenshots/04-admin-dashboard.png', fullPage: true });
  
  // Check console for actual routes
  console.log('   Current URL:', page.url());
  
  console.log('\n✅ Screenshots captured!');
  console.log('📁 Location: /tmp/ui-screenshots/');
});
