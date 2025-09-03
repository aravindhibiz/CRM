import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('should navigate between main sections', async ({ authenticatedPage }) => {
    // Test navigation to different sections
    const navigationItems = [
      { name: 'Dashboard', path: '/sales-dashboard', heading: 'Dashboard' },
      { name: 'Contacts', path: '/contact-management', heading: 'Contact Management' },
      { name: 'Deals', path: '/deal-management', heading: 'Deal Management' },
      { name: 'Activities', path: '/activity-timeline', heading: 'Activity Timeline' },
      { name: 'Analytics', path: '/pipeline-analytics', heading: 'Pipeline Analytics' },
    ];

    for (const item of navigationItems) {
      await authenticatedPage.click(`text=${item.name}`);
      await authenticatedPage.waitForURL(`**${item.path}`, { timeout: 5000 });
      
      // Verify the page loaded correctly
      await expect(authenticatedPage.locator('h1, h2, h3')).toContainText(item.heading);
    }
  });

  test('should have responsive navigation', async ({ authenticatedPage }) => {
    // Test mobile navigation
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
    
    // Look for mobile menu button (adjust selector based on your implementation)
    const mobileMenuButton = authenticatedPage.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Verify mobile menu is open
      await expect(authenticatedPage.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
    
    // Test desktop navigation
    await authenticatedPage.setViewportSize({ width: 1280, height: 720 });
    await expect(authenticatedPage.locator('nav')).toBeVisible();
  });

  test('should handle theme toggle', async ({ authenticatedPage }) => {
    // Look for theme toggle button
    const themeToggle = authenticatedPage.locator('[data-testid="theme-toggle"]');
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await authenticatedPage.locator('html').getAttribute('class');
      
      // Click theme toggle
      await themeToggle.click();
      
      // Verify theme changed
      const newTheme = await authenticatedPage.locator('html').getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});
