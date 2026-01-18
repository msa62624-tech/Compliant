import { test } from '@playwright/test';

const ADMIN_EMAIL = 'miriamsabel@insuretrack.onmicrosoft.com';
const ADMIN_PASSWORD = '260Hooper';

test('Complete UI Workflow with Many Screenshots', async ({ page }) => {
  console.log('\n🎬 Starting Complete UI Workflow Test with Screenshots\n');
  let screenshotNumber = 1;
  
  const takeScreenshot = async (description: string) => {
    const num = String(screenshotNumber++).padStart(2, '0');
    await page.screenshot({ path: `/tmp/ui-screenshots/${num}-${description}.png`, fullPage: true });
    console.log(`   📸 Screenshot ${num}: ${description}`);
  };
  
  // Step 1: Homepage
  console.log('✓ Step 1: Visit Homepage');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await takeScreenshot('homepage');
  
  // Step 2: Navigate to login
  console.log('✓ Step 2: Login Page');
  await page.click('a[href="/login"]');
  await page.waitForTimeout(2000);
  await takeScreenshot('login-page');
  
  // Step 3: Login as admin
  console.log('✓ Step 3: Admin Login');
  await page.fill('input[placeholder="admin@compliant.com"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await takeScreenshot('login-credentials-entered');
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(3000);
  await takeScreenshot('admin-dashboard-after-login');
  
  console.log(`   ℹ️  Logged in! Current URL: ${page.url()}`);
  
  // Step 4: Navigate through admin pages
  console.log('✓ Step 4: Admin Pages Navigation');
  
  // Try to find navigation links
  const links = await page.locator('a').all();
  console.log(`   Found ${links.length} links on dashboard`);
  
  // Take screenshots of different sections
  try {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    await takeScreenshot('dashboard-full-view');
  } catch (e) { console.log('   Skipped dashboard'); }
  
  try {
    await page.goto('http://localhost:3000/admin/contractors');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-contractors-list');
  } catch (e) { console.log('   Skipped contractors'); }
  
  try {
    await page.goto('http://localhost:3000/admin/projects');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-projects-list');
  } catch (e) { console.log('   Skipped projects'); }
  
  try {
    await page.goto('http://localhost:3000/admin/programs');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-programs-list');
  } catch (e) { console.log('   Skipped programs'); }
  
  try {
    await page.goto('http://localhost:3000/admin/coi-reviews');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-coi-reviews');
  } catch (e) { console.log('   Skipped COI reviews'); }
  
  try {
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-users-list');
  } catch (e) { console.log('   Skipped users'); }
  
  // Step 5: Test creation forms
  console.log('✓ Step 5: Test Form Pages');
  
  try {
    await page.goto('http://localhost:3000/admin/contractors/new');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-new-contractor-form');
  } catch (e) { console.log('   Skipped new contractor'); }
  
  try {
    await page.goto('http://localhost:3000/admin/projects/new');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-new-project-form');
  } catch (e) { console.log('   Skipped new project'); }
  
  try {
    await page.goto('http://localhost:3000/admin/programs/new');
    await page.waitForTimeout(2000);
    await takeScreenshot('admin-new-program-form');
  } catch (e) { console.log('   Skipped new program'); }
  
  // Step 6: Logout and test other user types
  console.log('✓ Step 6: Logout');
  await page.goto('http://localhost:3000/logout');
  await page.waitForTimeout(2000);
  await takeScreenshot('after-logout');
  
  // Step 7: Try logging in as different demo users
  console.log('✓ Step 7: Test Other User Logins');
  
  const demoUsers = [
    { email: 'contractor@compliant.com', password: 'Contractor123!@#', role: 'Contractor' },
    { email: 'subcontractor@compliant.com', password: 'Subcontractor123!@#', role: 'Subcontractor' },
    { email: 'broker@compliant.com', password: 'Broker123!@#', role: 'Broker' },
  ];
  
  for (const user of demoUsers) {
    try {
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(1000);
      await page.fill('input[placeholder="admin@compliant.com"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await takeScreenshot(`${user.role.toLowerCase()}-login-filled`);
      await page.click('button:has-text("Sign in")');
      await page.waitForTimeout(3000);
      await takeScreenshot(`${user.role.toLowerCase()}-dashboard`);
      
      // Try to navigate to role-specific pages
      await page.goto(`http://localhost:3000/${user.role.toLowerCase()}/dashboard`);
      await page.waitForTimeout(2000);
      await takeScreenshot(`${user.role.toLowerCase()}-specific-dashboard`);
      
      await page.goto('http://localhost:3000/logout');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log(`   Error with ${user.role}: ${e.message}`);
    }
  }
  
  console.log('\n✅ Complete UI Workflow Test Finished!');
  console.log(`📸 Total Screenshots: ${screenshotNumber - 1}`);
  console.log('📁 Location: /tmp/ui-screenshots/\n');
});
