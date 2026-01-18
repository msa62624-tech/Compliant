import { test, expect } from '@playwright/test';

/**
 * Basic E2E Health Check Tests
 * These tests verify that the application is running and accessible
 */

test.describe('Health Checks', () => {
  test('backend health endpoint should be accessible', async ({ request }) => {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    
    const response = await request.get(`${apiBaseUrl}/health`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
  });

  test('frontend should load successfully', async ({ page, baseURL }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify the page loaded without critical errors
    // Check that we're on the expected base URL
    if (baseURL) {
      const currentUrl = new URL(page.url());
      const expectedUrl = new URL(baseURL);
      expect(currentUrl.origin).toBe(expectedUrl.origin);
    }
  });

  test('frontend should have proper title or content', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be ready
    await page.waitForLoadState('domcontentloaded');
    
    // Check if the page has loaded some content
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent!.length).toBeGreaterThan(0);
  });
});
