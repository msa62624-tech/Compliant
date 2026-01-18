import { test, expect } from '@playwright/test';

test.describe('Capture ALL Real Pages with Data', () => {
  test('Complete workflow with ALL pages screenshotted', async ({ page }) => {
    const screenshotDir = '/home/runner/work/Compliant-/Compliant-/screenshots-complete-real';
    
    // Wait for services
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    // 1. Homepage
    await page.screenshot({ path: `${screenshotDir}/01-homepage.png`, fullPage: true });
    
    // 2. LOGIN AS ADMIN - see real admin dashboard with data
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/02-login-page.png`, fullPage: true });
    
    await page.fill('input[type="email"]', 'miriamsabel@insuretrack.onmicrosoft.com');
    await page.fill('input[type="password"]', '260Hooper');
    await page.screenshot({ path: `${screenshotDir}/03-admin-login-filled.png`, fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 3. Admin Dashboard with REAL DATA
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/04-admin-dashboard-real-data.png`, fullPage: true });
    
    // 4. Admin - General Contractors List (with seeded contractors)
    await page.goto('http://localhost:3000/admin/general-contractors');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/05-admin-contractors-list-with-data.png`, fullPage: true });
    
    // 5. Admin - Create New Contractor Form
    await page.goto('http://localhost:3000/admin/general-contractors/new');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/06-admin-create-contractor-form.png`, fullPage: true });
    
    // 6. Admin - Projects List (with seeded project)
    await page.goto('http://localhost:3000/admin/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/07-admin-projects-list-with-data.png`, fullPage: true });
    
    // 7. Admin - Create New Project Form
    await page.goto('http://localhost:3000/admin/projects/new');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/08-admin-create-project-form.png`, fullPage: true });
    
    // 8. Admin - Programs List
    await page.goto('http://localhost:3000/admin/programs');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/09-admin-programs-list.png`, fullPage: true });
    
    // 9. Admin - COI Reviews Queue
    await page.goto('http://localhost:3000/admin/coi-reviews');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/10-admin-coi-reviews-queue.png`, fullPage: true });
    
    // 10. Admin - Users Management
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/11-admin-users-list-with-data.png`, fullPage: true });
    
    // 11. Admin - Settings
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/12-admin-settings-page.png`, fullPage: true });
    
    // 12. Admin - Reports
    await page.goto('http://localhost:3000/admin/reports');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/13-admin-reports-page.png`, fullPage: true });
    
    // LOGOUT
    await page.goto('http://localhost:3000/logout');
    await page.waitForTimeout(2000);
    
    // 13. LOGIN AS GC/CONTRACTOR - see their dashboard with projects
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'miriamsabel1@gmail.com');
    await page.fill('input[type="password"]', 'Contractor123!@#');
    await page.screenshot({ path: `${screenshotDir}/14-gc-login-filled.png`, fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 14. GC Dashboard with REAL DATA
    await page.goto('http://localhost:3000/contractor/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/15-gc-dashboard-real-data.png`, fullPage: true });
    
    // 15. GC - Projects List
    await page.goto('http://localhost:3000/gc/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/16-gc-projects-list-with-data.png`, fullPage: true });
    
    // 16. GC - Subcontractors List
    await page.goto('http://localhost:3000/gc/subcontractors');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/17-gc-subcontractors-list-with-data.png`, fullPage: true });
    
    // 17. GC - Compliance View
    await page.goto('http://localhost:3000/gc/compliance');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/18-gc-compliance-view-with-data.png`, fullPage: true });
    
    // 18. GC - Documents
    await page.goto('http://localhost:3000/contractor/documents');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/19-gc-documents-page.png`, fullPage: true });
    
    // LOGOUT
    await page.goto('http://localhost:3000/logout');
    await page.waitForTimeout(2000);
    
    // 19. LOGIN AS SUBCONTRACTOR - see their view
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'msa62624@gmail.com');
    await page.fill('input[type="password"]', 'Subcontractor123!@#');
    await page.screenshot({ path: `${screenshotDir}/20-sub-login-filled.png`, fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 20. Subcontractor Dashboard
    await page.goto('http://localhost:3000/subcontractor/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/21-sub-dashboard-real-data.png`, fullPage: true });
    
    // 21. Subcontractor - Projects
    await page.goto('http://localhost:3000/subcontractor/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/22-sub-projects-list-with-data.png`, fullPage: true });
    
    // 22. Subcontractor - Broker Information Form
    await page.goto('http://localhost:3000/subcontractor/broker');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/23-sub-broker-info-form.png`, fullPage: true });
    
    // 23. Subcontractor - Compliance
    await page.goto('http://localhost:3000/subcontractor/compliance');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/24-sub-compliance-view-with-data.png`, fullPage: true });
    
    // 24. Subcontractor - Documents
    await page.goto('http://localhost:3000/subcontractor/documents');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/25-sub-documents-page.png`, fullPage: true });
    
    // LOGOUT
    await page.goto('http://localhost:3000/logout');
    await page.waitForTimeout(2000);
    
    // 25. LOGIN AS BROKER - see their view
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'msabel@hmlbrokerage.com');
    await page.fill('input[type="password"]', 'Broker123!@#');
    await page.screenshot({ path: `${screenshotDir}/26-broker-login-filled.png`, fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 26. Broker Dashboard
    await page.goto('http://localhost:3000/broker/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/27-broker-dashboard-real-data.png`, fullPage: true });
    
    // 27. Broker - Projects
    await page.goto('http://localhost:3000/broker/projects');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/28-broker-projects-list.png`, fullPage: true });
    
    // 28. Broker - Upload Page
    await page.goto('http://localhost:3000/broker/upload');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/29-broker-upload-coi-form.png`, fullPage: true });
    
    // 29. Broker - Compliance
    await page.goto('http://localhost:3000/broker/compliance');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/30-broker-compliance-view.png`, fullPage: true });
    
    // 30. Broker - Documents
    await page.goto('http://localhost:3000/broker/documents');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/31-broker-documents-page.png`, fullPage: true });
    
    // 31. API Documentation (Swagger)
    await page.goto('http://localhost:3001/api/docs');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${screenshotDir}/32-api-swagger-documentation.png`, fullPage: true });
    
    console.log('✅ ALL 32 REAL PAGES CAPTURED WITH DATA!');
  });
});
