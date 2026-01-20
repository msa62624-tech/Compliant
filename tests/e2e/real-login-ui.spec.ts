import { test, expect } from '@playwright/test';
import { ScreenshotHelper } from './screenshot-helper';

/**
 * Real Login and Navigation E2E Test
 * 
 * This test performs an actual login through the UI and captures screenshots
 * at every step of navigation through the application.
 */

test.describe('Real Login and Navigation with Screenshots', () => {
  
  test('Login as GC and navigate through the application', async ({ page }) => {
    const screenshots = new ScreenshotHelper('real-login-gc-navigation');
    screenshots.startConsoleMonitoring(page);

    // Step 1: Navigate to login page
    console.log('\n📋 Step 1: Navigate to Login Page');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, '001-login-page-loaded', true);
    console.log('✓ Login page loaded');

    // Step 2: Enter GC credentials (Prestige Builders)
    console.log('\n📋 Step 2: Enter GC Credentials - Prestige Builders');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('contractor@compliant.com');
    await screenshots.capture(page, '002-email-entered');
    console.log('✓ Email entered: contractor@compliant.com');
    
    await passwordInput.fill('Contractor123!@#');
    await screenshots.capture(page, '003-password-entered');
    console.log('✓ Password entered');

    // Step 3: Click login button
    console.log('\n📋 Step 3: Click Login Button');
    const loginButton = page.locator('button[type="submit"]').first();
    await screenshots.capture(page, '004-before-login-click');
    await loginButton.click();
    console.log('✓ Login button clicked');

    // Step 4: Wait for navigation after login
    console.log('\n📋 Step 4: Wait for Successful Login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for any animations/redirects
    await screenshots.capture(page, '005-after-login-redirect', true);
    
    const currentUrl = page.url();
    console.log(`✓ Redirected to: ${currentUrl}`);

    // Step 5: Verify we're logged in (should not be on /login anymore)
    expect(currentUrl).not.toContain('/login');
    console.log('✓ Login successful - not on login page');
    await screenshots.capture(page, '006-logged-in-homepage', true);

    // Step 6: Navigate to dashboard/projects
    console.log('\n📋 Step 6: Navigate to Dashboard/Projects');
    try {
      // Try to find and click on projects or dashboard link
      const navLinks = await page.locator('nav a, [role="navigation"] a').all();
      console.log(`Found ${navLinks.length} navigation links`);
      
      for (const link of navLinks) {
        const text = await link.textContent();
        console.log(`  - Nav link: ${text}`);
      }

      // Try to navigate to common pages
      const pagesToTry = ['/dashboard', '/projects', '/gc/dashboard', '/gc/projects'];
      let navigated = false;
      
      for (const pagePath of pagesToTry) {
        try {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
          const finalUrl = page.url();
          
          if (!finalUrl.includes('/login')) {
            console.log(`✓ Successfully navigated to: ${pagePath}`);
            await screenshots.capture(page, `007-navigated-to-${pagePath.replace(/\//g, '-')}`, true);
            navigated = true;
            break;
          }
        } catch (error) {
          console.log(`  - ${pagePath} not accessible`);
        }
      }

      if (!navigated) {
        console.log('  No specific dashboard found, staying on current page');
        await screenshots.capture(page, '007-current-page-after-login', true);
      }

    } catch (error) {
      console.log('  Navigation exploration completed');
      await screenshots.capture(page, '007-navigation-state', true);
    }

    // Step 7: Check what's on the page
    console.log('\n📋 Step 7: Inspect Page Content');
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Check for common UI elements
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    const forms = await page.locator('form').count();
    
    console.log(`UI Elements found:`);
    console.log(`  - Buttons: ${buttons}`);
    console.log(`  - Links: ${links}`);
    console.log(`  - Forms: ${forms}`);
    
    await screenshots.capture(page, '008-page-content-analysis', true);

    // Step 8: Try to find user info/profile
    console.log('\n📋 Step 8: Look for User Profile/Settings');
    const userElements = await page.locator('text=/profile|settings|logout|account/i').all();
    if (userElements.length > 0) {
      console.log(`✓ Found ${userElements.length} user-related elements`);
      await screenshots.capture(page, '009-user-menu-detected');
    }

    // Final step: Capture final state
    console.log('\n📋 Step 9: Final State Capture');
    await screenshots.capture(page, '010-final-state', true);

    // Save console summary
    screenshots.saveConsoleSummary();

    console.log('\n' + '='.repeat(70));
    console.log('✅ REAL LOGIN TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log(`\n📊 Test Summary:`);
    console.log(`  Login Email: contractor@compliant.com (GC - Prestige Builders)`);
    console.log(`  Final URL: ${page.url()}`);
    console.log(`  Page Title: ${pageTitle}`);
    console.log(`\n📸 Screenshots: ${screenshots.getCount()} captured`);
    console.log(`📊 Console Messages: ${screenshots.getConsoleMessages().length} monitored`);
    console.log(screenshots.getConsoleSummary());
    console.log(`\n📁 All screenshots saved to: ${screenshots.getDirectory()}`);
    console.log('='.repeat(70));
  });

  test('Login as Admin and navigate', async ({ page }) => {
    const screenshots = new ScreenshotHelper('real-login-admin-navigation');
    screenshots.startConsoleMonitoring(page);

    console.log('\n📋 Admin Login Test Started');
    
    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, '001-admin-login-page', true);

    // Login as admin
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('admin@compliant.com');
    await passwordInput.fill('Admin123!@#');
    await screenshots.capture(page, '002-admin-credentials-entered');

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshots.capture(page, '003-admin-logged-in', true);

    const currentUrl = page.url();
    console.log(`✓ Admin logged in, redirected to: ${currentUrl}`);
    expect(currentUrl).not.toContain('/login');

    // Try to navigate to admin areas
    const adminPages = ['/admin/dashboard', '/admin/projects', '/admin/programs', '/dashboard'];
    
    for (const pagePath of adminPages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        const url = page.url();
        
        if (!url.includes('/login')) {
          console.log(`✓ Admin access to: ${pagePath}`);
          await screenshots.capture(page, `004-admin-${pagePath.replace(/\//g, '-')}`, true);
          break;
        }
      } catch (error) {
        console.log(`  - ${pagePath} not accessible`);
      }
    }

    await screenshots.capture(page, '005-admin-final-state', true);
    screenshots.saveConsoleSummary();

    console.log(`\n✅ Admin login test completed`);
    console.log(`📸 Screenshots: ${screenshots.getCount()} captured`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Login as Subcontractor and navigate', async ({ page }) => {
    const screenshots = new ScreenshotHelper('real-login-subcontractor-navigation');
    screenshots.startConsoleMonitoring(page);

    console.log('\n📋 Subcontractor Login Test Started');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, '001-subcontractor-login-page', true);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('subcontractor@compliant.com');
    await passwordInput.fill('Subcontractor123!@#');
    await screenshots.capture(page, '002-subcontractor-credentials-entered');

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshots.capture(page, '003-subcontractor-logged-in', true);

    const currentUrl = page.url();
    console.log(`✓ Subcontractor logged in, redirected to: ${currentUrl}`);
    expect(currentUrl).not.toContain('/login');

    // Try subcontractor pages
    const subPages = ['/subcontractor/dashboard', '/subcontractor/compliance', '/subcontractor/broker', '/dashboard'];
    
    for (const pagePath of subPages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        const url = page.url();
        
        if (!url.includes('/login')) {
          console.log(`✓ Subcontractor access to: ${pagePath}`);
          await screenshots.capture(page, `004-subcontractor-${pagePath.replace(/\//g, '-')}`, true);
          break;
        }
      } catch (error) {
        console.log(`  - ${pagePath} not accessible`);
      }
    }

    await screenshots.capture(page, '005-subcontractor-final-state', true);
    screenshots.saveConsoleSummary();

    console.log(`\n✅ Subcontractor login test completed`);
    console.log(`📸 Screenshots: ${screenshots.getCount()} captured`);
    console.log(screenshots.getConsoleSummary());
  });
});
