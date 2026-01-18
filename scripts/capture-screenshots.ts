import { chromium, Browser, Page } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Comprehensive screenshot capture script for Compliant Platform
 * Captures all pages and dashboards for documentation
 */

const SCREENSHOTS_DIR = join(__dirname, '..', 'docs', 'screenshots');
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

const TEST_USERS: TestUser[] = [
  { email: 'admin@compliant.com', password: 'Admin123!@#', role: 'admin', name: 'Admin' },
  { email: 'manager@compliant.com', password: 'Manager123!@#', role: 'manager', name: 'Manager' },
  { email: 'contractor@compliant.com', password: 'Contractor123!@#', role: 'contractor', name: 'Contractor' },
  { email: 'subcontractor@compliant.com', password: 'Subcontractor123!@#', role: 'subcontractor', name: 'Subcontractor' },
  { email: 'broker@compliant.com', password: 'Broker123!@#', role: 'broker', name: 'Broker' },
];

async function setupScreenshotsDirectory() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  console.log(`✓ Screenshots directory created: ${SCREENSHOTS_DIR}`);
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  console.log(`✓ Logged in as ${email}`);
}

async function captureScreenshot(page: Page, name: string, fullPage: boolean = false) {
  const filename = join(SCREENSHOTS_DIR, `${name}.png`);
  
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: filename, fullPage });
  
  console.log(`  ✓ Captured: ${name}.png`);
}

async function capturePublicPages(page: Page) {
  console.log('\n📸 Capturing Public Pages...');
  
  // Homepage
  await page.goto(`${BASE_URL}/`);
  await captureScreenshot(page, '01-homepage', true);
  
  // Login page
  await page.goto(`${BASE_URL}/login`);
  await captureScreenshot(page, '02-login-page');
}

async function captureAPIDocumentation(page: Page) {
  console.log('\n📸 Capturing API Documentation...');
  
  // Swagger UI main page
  await page.goto(`${API_URL}/api/docs`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Give Swagger time to fully render
  await captureScreenshot(page, '03-api-docs-overview', true);
  
  // Try to expand sections if they exist
  const sections = [
    { text: 'Authentication', file: '04-api-docs-authentication' },
    { text: 'Users', file: '05-api-docs-users' },
    { text: 'Contractors', file: '06-api-docs-contractors' },
    { text: 'Generated COI', file: '07-api-docs-generated-coi' },
  ];
  
  for (const section of sections) {
    try {
      await page.click(`text=${section.text}`, { timeout: 5000 });
      await page.waitForTimeout(500);
      await captureScreenshot(page, section.file, true);
    } catch (error) {
      console.log(`  ⚠ Could not capture ${section.file} (section may not be visible)`);
    }
  }
}

async function captureAdminPages(page: Page) {
  console.log('\n📸 Capturing Admin Pages...');
  
  await login(page, 'admin@compliant.com', 'Admin123!@#');
  
  // Admin Dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await captureScreenshot(page, '08-admin-dashboard', true);
  
  // Admin pages
  const adminPages = [
    { url: '/admin/general-contractors', name: '09-admin-general-contractors' },
    { url: '/admin/contractors', name: '10-admin-contractors' },
    { url: '/admin/projects', name: '11-admin-projects' },
    { url: '/admin/coi-reviews', name: '12-admin-coi-reviews' },
    { url: '/admin/coi', name: '13-admin-coi' },
    { url: '/admin/programs', name: '14-admin-programs' },
    { url: '/admin/reports', name: '15-admin-reports' },
    { url: '/admin/users', name: '16-admin-users' },
    { url: '/admin/settings', name: '17-admin-settings' },
  ];
  
  for (const adminPage of adminPages) {
    try {
      await page.goto(`${BASE_URL}${adminPage.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await captureScreenshot(page, adminPage.name, true);
    } catch (error) {
      console.log(`  ⚠ Could not capture ${adminPage.name} (page may not be implemented)`);
    }
  }
}

async function captureManagerPages(page: Page) {
  console.log('\n📸 Capturing Manager Pages...');
  
  await login(page, 'manager@compliant.com', 'Manager123!@#');
  
  // Manager Dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await captureScreenshot(page, '18-manager-dashboard', true);
}

async function captureContractorPages(page: Page) {
  console.log('\n📸 Capturing Contractor/GC Pages...');
  
  await login(page, 'contractor@compliant.com', 'Contractor123!@#');
  
  // Contractor Dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await captureScreenshot(page, '19-contractor-dashboard', true);
  
  // Try GC-specific pages
  const contractorPages = [
    { url: '/projects', name: '20-contractor-projects' },
  ];
  
  for (const contractorPage of contractorPages) {
    try {
      await page.goto(`${BASE_URL}${contractorPage.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await captureScreenshot(page, contractorPage.name, true);
    } catch (error) {
      console.log(`  ⚠ Could not capture ${contractorPage.name}`);
    }
  }
}

async function captureSubcontractorPages(page: Page) {
  console.log('\n📸 Capturing Subcontractor Pages...');
  
  await login(page, 'subcontractor@compliant.com', 'Subcontractor123!@#');
  
  // Subcontractor Dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await captureScreenshot(page, '21-subcontractor-dashboard', true);
  
  // Subcontractor pages
  const subPages = [
    { url: '/subcontractor/projects', name: '22-subcontractor-projects' },
    { url: '/subcontractor/broker', name: '23-subcontractor-broker' },
    { url: '/subcontractor/documents', name: '24-subcontractor-documents' },
    { url: '/subcontractor/compliance', name: '25-subcontractor-compliance' },
  ];
  
  for (const subPage of subPages) {
    try {
      await page.goto(`${BASE_URL}${subPage.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await captureScreenshot(page, subPage.name, true);
    } catch (error) {
      console.log(`  ⚠ Could not capture ${subPage.name}`);
    }
  }
}

async function captureBrokerPages(page: Page) {
  console.log('\n📸 Capturing Broker Pages...');
  
  await login(page, 'broker@compliant.com', 'Broker123!@#');
  
  // Broker Dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await captureScreenshot(page, '26-broker-dashboard', true);
  
  // Broker pages
  const brokerPages = [
    { url: '/broker/upload', name: '27-broker-upload' },
    { url: '/broker/projects', name: '28-broker-projects' },
  ];
  
  for (const brokerPage of brokerPages) {
    try {
      await page.goto(`${BASE_URL}${brokerPage.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await captureScreenshot(page, brokerPage.name, true);
    } catch (error) {
      console.log(`  ⚠ Could not capture ${brokerPage.name}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting screenshot capture process...\n');
  console.log(`Frontend URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Output Directory: ${SCREENSHOTS_DIR}\n`);
  
  await setupScreenshotsDirectory();
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  
  try {
    // Capture all pages
    await capturePublicPages(page);
    await captureAPIDocumentation(page);
    await captureAdminPages(page);
    await captureManagerPages(page);
    await captureContractorPages(page);
    await captureSubcontractorPages(page);
    await captureBrokerPages(page);
    
    console.log('\n✅ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);
  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
