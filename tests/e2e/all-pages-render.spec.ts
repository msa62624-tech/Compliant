import { test, expect } from '@playwright/test';
import { ScreenshotHelper } from './screenshot-helper';

/**
 * Comprehensive Page Render Test
 * 
 * This test captures screenshots of EVERY page in the system across all user roles.
 * It creates visual documentation of the entire application.
 */

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_PATH = '/api';
const API_VERSION = '1';

// Admin credentials (pre-seeded)
const ADMIN_CREDENTIALS = {
  email: 'admin@compliant.com',
  password: 'Admin123!@#'
};

// Helper to get auth token via API
async function getAuthToken(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${API_PATH}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': API_VERSION,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.accessToken;
}

// Helper to create contractor (returns auto-generated credentials)
async function createContractor(token: string, data: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${API_PATH}/contractors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-API-Version': API_VERSION,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create contractor failed (${response.status}): ${error}`);
  }

  return await response.json();
}

// Helper to create subcontractor
async function createSubcontractor(token: string, data: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${API_PATH}/subcontractors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-API-Version': API_VERSION,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create subcontractor failed (${response.status}): ${error}`);
  }

  return await response.json();
}

// Helper to login via UI
async function loginViaUI(page: any, email: string, password: string, screenshots: ScreenshotHelper, stepPrefix: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await screenshots.capture(page, `${stepPrefix}-login-page`);
  
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await screenshots.capture(page, `${stepPrefix}-login-form-filled`);
  
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for any redirects
}

test.describe('Comprehensive Page Renders - All Pages in System', () => {
  
  test('Capture all public pages', async ({ page }) => {
    const screenshots = new ScreenshotHelper('all_pages_public');
    screenshots.startConsoleMonitoring(page);

    console.log('\n═══════════════════════════════════════');
    console.log('📸 CAPTURING PUBLIC PAGES');
    console.log('═══════════════════════════════════════\n');

    // Home page
    console.log('📋 Capturing: Home Page');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, '001-home-page', true);

    // Login page
    console.log('📋 Capturing: Login Page');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, '002-login-page', true);

    // 404 page
    console.log('📋 Capturing: 404 Not Found Page');
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    await screenshots.capture(page, '003-404-page', true);

    screenshots.saveConsoleSummary();
    console.log(`\n✓ Public pages captured: ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Capture all Admin pages', async ({ page }) => {
    const screenshots = new ScreenshotHelper('all_pages_admin');
    screenshots.startConsoleMonitoring(page);

    console.log('\n═══════════════════════════════════════');
    console.log('📸 CAPTURING ADMIN PAGES');
    console.log('═══════════════════════════════════════\n');

    // Login as Admin
    console.log('🔐 Logging in as Admin...');
    await loginViaUI(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password, screenshots, 'admin');

    // Admin Dashboard
    console.log('📋 Capturing: Admin Dashboard');
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '010-admin-dashboard', true);

    // Note: /admin/contractors redirects to /admin/general-contractors
    // Skipping duplicate screenshot

    // New Contractor Form
    console.log('📋 Capturing: New Contractor Form');
    await page.goto('/admin/contractors/new');
    await page.waitForLoadState('networkidle');
    // Wait for the form to actually load (not just the loading spinner)
    await page.waitForSelector('form', { timeout: 10000 }).catch(() => console.log('Form did not load'));
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '011-admin-contractors-new', true);

    // General Contractors List  
    console.log('📋 Capturing: General Contractors List');
    await page.goto('/admin/general-contractors');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '012-admin-general-contractors-list', true);

    // Projects List
    console.log('📋 Capturing: Projects List');
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '014-admin-projects-list', true);

    // New Project Form
    console.log('📋 Capturing: New Project Form');
    await page.goto('/admin/projects/new');
    await page.waitForLoadState('networkidle');
    // Wait for the form to actually load
    await page.waitForSelector('form', { timeout: 10000 }).catch(() => console.log('Form did not load'));
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '015-admin-projects-new', true);

    // Programs List
    console.log('📋 Capturing: Programs List');
    await page.goto('/admin/programs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '016-admin-programs-list', true);

    // New Program Form
    console.log('📋 Capturing: New Program Form');
    await page.goto('/admin/programs/new');
    await page.waitForLoadState('networkidle');
    // Wait for the form to actually load
    await page.waitForSelector('form', { timeout: 10000 }).catch(() => console.log('Form did not load'));
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '017-admin-programs-new', true);

    // COI List
    console.log('📋 Capturing: COI List');
    await page.goto('/admin/coi');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '018-admin-coi-list', true);

    // COI Reviews
    console.log('📋 Capturing: COI Reviews');
    await page.goto('/admin/coi-reviews');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '019-admin-coi-reviews', true);

    // Users List
    console.log('📋 Capturing: Users List');
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '020-admin-users-list', true);

    // Reports
    console.log('📋 Capturing: Reports');
    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '021-admin-reports', true);

    // Settings
    console.log('📋 Capturing: Settings');
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '022-admin-settings', true);

    screenshots.saveConsoleSummary();
    console.log(`\n✓ Admin pages captured: ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Capture all General Contractor (GC) pages', async ({ page }) => {
    const screenshots = new ScreenshotHelper('all_pages_gc');
    screenshots.startConsoleMonitoring(page);

    console.log('\n═══════════════════════════════════════');
    console.log('📸 CAPTURING GC PAGES');
    console.log('═══════════════════════════════════════\n');

    // Create GC contractor
    console.log('🔧 Setting up: Creating GC contractor...');
    const adminToken = await getAuthToken(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    const uniqueEmail = `test.gc.renders.${Date.now()}@example.com`;
    const gcContractor = await createContractor(adminToken, {
      name: 'Test GC Renders Company',
      email: uniqueEmail,
      phone: '(555) 200-0001',
      company: 'Test GC Renders Company',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      status: 'ACTIVE',
      trades: ['General Construction'],
    });
    
    const gcEmail = gcContractor.userAccount.email;
    const gcPassword = gcContractor.userAccount.password;
    console.log(`✓ GC created: ${gcEmail}`);

    // Login as GC
    console.log('🔐 Logging in as GC...');
    await loginViaUI(page, gcEmail, gcPassword, screenshots, 'gc');

    // GC Dashboard
    console.log('📋 Capturing: GC Dashboard');
    await page.goto('/gc/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '030-gc-dashboard', true);

    // GC Projects
    console.log('📋 Capturing: GC Projects');
    await page.goto('/gc/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '031-gc-projects', true);

    // GC Subcontractors
    console.log('📋 Capturing: GC Subcontractors');
    await page.goto('/gc/subcontractors');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '032-gc-subcontractors', true);

    // GC Compliance
    console.log('📋 Capturing: GC Compliance');
    await page.goto('/gc/compliance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '033-gc-compliance', true);

    screenshots.saveConsoleSummary();
    console.log(`\n✓ GC pages captured: ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Capture all Subcontractor pages', async ({ page }) => {
    const screenshots = new ScreenshotHelper('all_pages_subcontractor');
    screenshots.startConsoleMonitoring(page);

    console.log('\n═══════════════════════════════════════');
    console.log('📸 CAPTURING SUBCONTRACTOR PAGES');
    console.log('═══════════════════════════════════════\n');

    // Create subcontractor
    console.log('🔧 Setting up: Creating Subcontractor...');
    const adminToken = await getAuthToken(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    const uniqueEmail = `test.sub.renders.${Date.now()}@example.com`;
    const subcontractor = await createSubcontractor(adminToken, {
      name: 'Test Sub Renders Company',
      email: uniqueEmail,
      phone: '(555) 300-0001',
      company: 'Test Sub Renders Company',
      address: '456 Sub St',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      status: 'ACTIVE',
      trades: ['Plumbing'],
    });
    
    const subEmail = subcontractor.userAccount.email;
    const subPassword = subcontractor.userAccount.password;
    console.log(`✓ Subcontractor created: ${subEmail}`);

    // Login as Subcontractor
    console.log('🔐 Logging in as Subcontractor...');
    await loginViaUI(page, subEmail, subPassword, screenshots, 'sub');

    // Subcontractor Dashboard
    console.log('📋 Capturing: Subcontractor Dashboard');
    await page.goto('/subcontractor/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '040-subcontractor-dashboard', true);

    // Subcontractor Projects
    console.log('📋 Capturing: Subcontractor Projects');
    await page.goto('/subcontractor/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '041-subcontractor-projects', true);

    // Subcontractor Documents
    console.log('📋 Capturing: Subcontractor Documents');
    await page.goto('/subcontractor/documents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '042-subcontractor-documents', true);

    // Subcontractor Compliance
    console.log('📋 Capturing: Subcontractor Compliance');
    await page.goto('/subcontractor/compliance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '043-subcontractor-compliance', true);

    // Subcontractor Broker
    console.log('📋 Capturing: Subcontractor Broker');
    await page.goto('/subcontractor/broker');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '044-subcontractor-broker', true);

    screenshots.saveConsoleSummary();
    console.log(`\n✓ Subcontractor pages captured: ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Capture all Broker pages', async ({ page }) => {
    const screenshots = new ScreenshotHelper('all_pages_broker');
    screenshots.startConsoleMonitoring(page);

    console.log('\n═══════════════════════════════════════');
    console.log('📸 CAPTURING BROKER PAGES');
    console.log('═══════════════════════════════════════\n');

    // Note: Broker role needs to be created through the API
    // For now, we'll try to access the pages if a broker user exists
    // or document that broker pages exist but need setup

    console.log('ℹ️  Broker pages exist but require broker user setup:');
    console.log('  - /broker/dashboard');
    console.log('  - /broker/projects');
    console.log('  - /broker/documents');
    console.log('  - /broker/compliance');
    console.log('  - /broker/upload');
    console.log('  - /broker/upload/[subId]');
    console.log('  - /broker/sign/[id]');

    screenshots.saveConsoleSummary();
    console.log(`\n✓ Broker pages documented`);
  });

  test('Capture all Contractor role pages', async ({ page }) => {
    const screenshots = new ScreenshotHelper('all_pages_contractor_role');
    screenshots.startConsoleMonitoring(page);

    console.log('\n═══════════════════════════════════════');
    console.log('📸 CAPTURING CONTRACTOR ROLE PAGES');
    console.log('═══════════════════════════════════════\n');

    // Create contractor with CONTRACTOR role
    console.log('🔧 Setting up: Creating Contractor...');
    const adminToken = await getAuthToken(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    const uniqueEmail = `test.contractor.renders.${Date.now()}@example.com`;
    const contractor = await createContractor(adminToken, {
      name: 'Test Contractor Renders',
      email: uniqueEmail,
      phone: '(555) 400-0001',
      company: 'Test Contractor Renders',
      address: '789 Contractor Ave',
      city: 'Queens',
      state: 'NY',
      zipCode: '11361',
      status: 'ACTIVE',
      trades: ['Electrical'],
    });
    
    const contractorEmail = contractor.userAccount.email;
    const contractorPassword = contractor.userAccount.password;
    console.log(`✓ Contractor created: ${contractorEmail}`);

    // Login as Contractor
    console.log('🔐 Logging in as Contractor...');
    await loginViaUI(page, contractorEmail, contractorPassword, screenshots, 'contractor');

    // Contractor Dashboard
    console.log('📋 Capturing: Contractor Dashboard');
    await page.goto('/contractor/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '050-contractor-dashboard', true);

    // Contractor Projects
    console.log('📋 Capturing: Contractor Projects');
    await page.goto('/contractor/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '051-contractor-projects', true);

    // Contractor Documents
    console.log('📋 Capturing: Contractor Documents');
    await page.goto('/contractor/documents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '052-contractor-documents', true);

    // Contractor Compliance
    console.log('📋 Capturing: Contractor Compliance');
    await page.goto('/contractor/compliance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '053-contractor-compliance', true);

    screenshots.saveConsoleSummary();
    console.log(`\n✓ Contractor role pages captured: ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });

  test('Capture generic/shared pages', async ({ page }) => {
    const screenshots = new ScreenshotHelper('all_pages_shared');
    screenshots.startConsoleMonitoring(page);

    console.log('\n═══════════════════════════════════════');
    console.log('📸 CAPTURING SHARED/GENERIC PAGES');
    console.log('═══════════════════════════════════════\n');

    // Login as Admin to access shared pages
    console.log('🔐 Logging in as Admin...');
    await loginViaUI(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password, screenshots, 'shared');

    // Dashboard (generic)
    console.log('📋 Capturing: Generic Dashboard');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '060-dashboard-generic', true);

    // COI (generic)
    console.log('📋 Capturing: Generic COI');
    await page.goto('/coi');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '061-coi-generic', true);

    // Note: /contractors redirects to /admin/general-contractors
    // Skipping duplicate screenshot

    // Projects (generic)
    console.log('📋 Capturing: Generic Projects');
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '062-projects-generic', true);

    // Programs (generic)
    console.log('📋 Capturing: Generic Programs');
    await page.goto('/programs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '063-programs-generic', true);

    // Documents (generic)
    console.log('📋 Capturing: Generic Documents');
    await page.goto('/documents');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '064-documents-generic', true);

    // Compliance (generic)
    console.log('📋 Capturing: Generic Compliance');
    await page.goto('/compliance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '065-compliance-generic', true);

    // Settings (generic)
    console.log('📋 Capturing: Generic Settings');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '066-settings-generic', true);

    // Users (generic)
    console.log('📋 Capturing: Generic Users');
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshots.capture(page, '068-users-generic', true);

    screenshots.saveConsoleSummary();
    console.log(`\n✓ Shared/generic pages captured: ${screenshots.getCount()} screenshots`);
    console.log(screenshots.getConsoleSummary());
  });
});
