import { test, expect } from '@playwright/test';

test.describe('LMS Pages', () => {
  test('my-courses redirects unauthenticated', async ({ page }) => {
    await page.goto('/lms/my-courses');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/this-does-not-exist-12345');
    await expect(page.getByText('404')).toBeVisible();
  });
});
