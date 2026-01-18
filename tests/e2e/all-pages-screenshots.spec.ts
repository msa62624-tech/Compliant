import { test, expect } from '@playwright/test';
import * as path from 'path';

const ADMIN_EMAIL = 'miriamsabel@insuretrack.onmicrosoft.com';
const ADMIN_PASSWORD = '260Hooper';
const CONTRACTOR_EMAIL = 'contractor@compliant.com';
const CONTRACTOR_PASSWORD = 'Contractor123!@#';
const SUB_EMAIL = 'subcontractor@compliant.com';
const SUB_PASSWORD = 'Subcontractor123!@#';
const BROKER_EMAIL = 'broker@compliant.com';
const BROKER_PASSWORD = 'Broker123!@#';

const outputDir = '/tmp/all-pages-screenshots';

let screenshotCounter = 1;

async function takeScreenshot(page: any, name: string) {
  const filename = path.join(outputDir, `${String(screenshotCounter++).padStart(3, '0')}-${name}.png`);
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 ${screenshotCounter - 1}: ${name}`);
  return filename;
}

test.describe('Complete Application Screenshots - All Pages', () => {
  
  test('Capture ALL pages with proper login redirect', async ({ page }) => {
    console.log('\n🎬 COMPREHENSIVE SCREENSHOT TEST - ALL PAGES\n');
    
    // 1. Homepage
    console.log('\n=== HOMEPAGE & PUBLIC PAGES ===');
    await page.goto('http://localhost:3000');
    await takeScreenshot(page, 'homepage');
    
    // 2. Login page
    await page.goto('http://localhost:3000/login');
    await takeScreenshot(page, 'login-page-empty');
    
    // 3. Login with admin credentials
    console.log('\n=== ADMIN LOGIN & PAGES ===');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await takeScreenshot(page, 'login-filled-admin');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check if redirected
    const currentUrl = page.url();
    console.log(`   After login URL: ${currentUrl}`);
    await takeScreenshot(page, 'after-login-redirect');
    
    // Admin pages
    const adminPages = [
      '/dashboard',
      '/admin/dashboard',
      '/admin/general-contractors',
      '/admin/contractors',
      '/admin/projects',
      '/admin/projects/new',
      '/admin/programs',
      '/admin/users',
      '/admin/settings',
      '/admin/coi-reviews',
      '/admin/coi',
      '/contractors',
      '/projects',
      '/programs',
      '/settings',
      '/users',
    ];
    
    for (const pagePath of adminPages) {
      try {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForTimeout(2000);
        const content = await page.content();
        if (!content.includes('404') && !content.includes('Not Found')) {
          await takeScreenshot(page, `admin${pagePath.replace(/\//g, '-')}`);
          console.log(`   ✓ ${pagePath}`);
        } else {
          console.log(`   ⚠️  ${pagePath} - 404`);
        }
      } catch (error) {
        console.log(`   ❌ ${pagePath} - Error`);
      }
    }
    
    // Logout
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(1000);
    
    // 4. Contractor/GC Login
    console.log('\n=== CONTRACTOR/GC LOGIN & PAGES ===');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', CONTRACTOR_EMAIL);
    await page.fill('input[type="password"]', CONTRACTOR_PASSWORD);
    await takeScreenshot(page, 'contractor-login-filled');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'contractor-after-login');
    
    const contractorPages = [
      '/dashboard',
      '/contractor/dashboard',
      '/contractor/projects',
      '/contractor/compliance',
      '/contractor/documents',
      '/gc/projects',
      '/gc/compliance',
      '/gc/subcontractors',
    ];
    
    for (const pagePath of contractorPages) {
      try {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForTimeout(2000);
        const content = await page.content();
        if (!content.includes('404')) {
          await takeScreenshot(page, `contractor${pagePath.replace(/\//g, '-')}`);
          console.log(`   ✓ ${pagePath}`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${pagePath}`);
      }
    }
    
    // 5. Subcontractor Login
    console.log('\n=== SUBCONTRACTOR LOGIN & PAGES ===');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', SUB_EMAIL);
    await page.fill('input[type="password"]', SUB_PASSWORD);
    await takeScreenshot(page, 'subcontractor-login-filled');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'subcontractor-after-login');
    
    const subPages = [
      '/dashboard',
      '/subcontractor/dashboard',
      '/subcontractor/projects',
      '/subcontractor/compliance',
      '/subcontractor/documents',
      '/subcontractor/broker',
    ];
    
    for (const pagePath of subPages) {
      try {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForTimeout(2000);
        const content = await page.content();
        if (!content.includes('404')) {
          await takeScreenshot(page, `subcontractor${pagePath.replace(/\//g, '-')}`);
          console.log(`   ✓ ${pagePath}`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${pagePath}`);
      }
    }
    
    // 6. Broker Login
    console.log('\n=== BROKER LOGIN & PAGES ===');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', BROKER_EMAIL);
    await page.fill('input[type="password"]', BROKER_PASSWORD);
    await takeScreenshot(page, 'broker-login-filled');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'broker-after-login');
    
    const brokerPages = [
      '/dashboard',
      '/broker/dashboard',
      '/broker/projects',
      '/broker/compliance',
      '/broker/documents',
      '/broker/upload',
    ];
    
    for (const pagePath of brokerPages) {
      try {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForTimeout(2000);
        const content = await page.content();
        if (!content.includes('404')) {
          await takeScreenshot(page, `broker${pagePath.replace(/\//g, '-')}`);
          console.log(`   ✓ ${pagePath}`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${pagePath}`);
      }
    }
    
    // 7. API Documentation
    console.log('\n=== API DOCUMENTATION ===');
    await page.goto('http://localhost:3001/api/docs');
    await takeScreenshot(page, 'api-swagger-homepage');
    
    const apiSections = [
      '#/auth',
      '#/contractors',
      '#/projects',
      '#/generated-coi',
      '#/hold-harmless',
      '#/users',
      '#/programs',
      '#/trades',
    ];
    
    for (const section of apiSections) {
      try {
        await page.goto(`http://localhost:3001/api/docs${section}`);
        await page.waitForTimeout(1500);
        await takeScreenshot(page, `api-${section.replace('#/', '').replace('/', '-')}`);
        console.log(`   ✓ API ${section}`);
      } catch (error) {
        console.log(`   ⚠️  API ${section}`);
      }
    }
    
    console.log(`\n✅ COMPLETE! Captured ${screenshotCounter - 1} screenshots`);
    console.log(`📁 Location: ${outputDir}/\n`);
  });
});

test.afterAll(() => {
  console.log('\n' + '='.repeat(70));
  console.log('🎉 ALL PAGES SCREENSHOT TEST COMPLETE');
  console.log('='.repeat(70));
  console.log(`📸 Total Screenshots: ${screenshotCounter - 1}`);
  console.log(`📁 Location: ${outputDir}/`);
  console.log('='.repeat(70) + '\n');
});
