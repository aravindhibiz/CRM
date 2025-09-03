import { test as base, expect } from '@playwright/test';

// Define test fixtures for common setup
export const test = base.extend({
  // Authentication fixture
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in login credentials (update with your test credentials)
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    
    // Click login button
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await use(page);
  },

  // Dashboard page fixture
  dashboardPage: async ({ authenticatedPage }, use) => {
    await authenticatedPage.goto('/sales-dashboard');
    await authenticatedPage.waitForLoadState('networkidle');
    await use(authenticatedPage);
  },

  // Contacts page fixture
  contactsPage: async ({ authenticatedPage }, use) => {
    await authenticatedPage.goto('/contact-management');
    await authenticatedPage.waitForLoadState('networkidle');
    await use(authenticatedPage);
  },

  // Deals page fixture
  dealsPage: async ({ authenticatedPage }, use) => {
    await authenticatedPage.goto('/deal-management');
    await authenticatedPage.waitForLoadState('networkidle');
    await use(authenticatedPage);
  },
});

export { expect } from '@playwright/test';
