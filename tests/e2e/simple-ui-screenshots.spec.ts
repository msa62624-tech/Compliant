import { test } from '@playwright/test';

const ADMIN_EMAIL = 'miriamsabel@insuretrack.onmicrosoft.com';
const ADMIN_PASSWORD = '260Hooper';

test('Capture Many UI Screenshots', async ({ page }) => {
  console.log('\n🎬 Capturing UI Screenshots\n');
  let num = 1;
  
  const shot = async (name: string) => {
    const n = String(num++).padStart(2, '0');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `/tmp/ui-screenshots/${n}-${name}.png`, fullPage: true });
    console.log(`   📸 ${n}: ${name}`);
  };
  
  // Homepage & Login
  await page.goto('http://localhost:3000');
  await shot('homepage');
  
  await page.goto('http://localhost:3000/login');
  await shot('login-page');
  
  await page.fill('input[placeholder="admin@compliant.com"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await shot('login-filled');
  
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(3000);
  await shot('admin-dashboard');
  
  // Admin pages
  const adminPages = [
    'dashboard',
    'admin/contractors',
    'admin/contractors/new',
    'admin/projects',
    'admin/projects/new',
    'admin/programs',
    'admin/programs/new',
    'admin/coi-reviews',
    'admin/users',
    'admin/users/new',
    'admin/settings',
    'admin/reports',
  ];
  
  for (const pagePath of adminPages) {
    try {
      await page.goto(`http://localhost:3000/${pagePath}`);
      await shot(pagePath.replace(/\//g, '-'));
    } catch (e) {
      console.log(`   ⚠️  Skipped: ${pagePath}`);
    }
  }
  
  // Logout
  await page.goto('http://localhost:3000/logout');
  await shot('logout');
  
  // Test other users
  const users = [
    ['contractor@compliant.com', 'Contractor123!@#', 'contractor'],
    ['subcontractor@compliant.com', 'Subcontractor123!@#', 'subcontractor'],
    ['broker@compliant.com', 'Broker123!@#', 'broker'],
  ];
  
  for (const [email, pass, role] of users) {
    try {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[placeholder="admin@compliant.com"]', email);
      await page.fill('input[type="password"]', pass);
      await shot(`${role}-login`);
      await page.click('button:has-text("Sign in")');
      await page.waitForTimeout(3000);
      await shot(`${role}-dashboard`);
      
      // Try role-specific pages
      const rolePages = [
        `${role}/dashboard`,
        `${role}/projects`,
        `${role}/compliance`,
        `${role}/documents`,
      ];
      
      for (const rp of rolePages) {
        try {
          await page.goto(`http://localhost:3000/${rp}`);
          await shot(rp.replace(/\//g, '-'));
        } catch (e) {}
      }
      
      await page.goto('http://localhost:3000/logout');
    } catch (e) {
      console.log(`   Error with ${role}`);
    }
  }
  
  console.log(`\n✅ Captured ${num-1} screenshots!\n`);
});
