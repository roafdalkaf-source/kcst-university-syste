import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@kcst.edu.sd';
const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  ?? 'testpassword123';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await expect(page.getByText('مرحباً بعودتك')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.fill('[type=email]',    'wrong@email.com');
    await page.fill('[type=password]', 'wrongpassword');
    await page.click('button[type=submit]');
    await expect(page.getByText(/خاطئة/i)).toBeVisible({ timeout: 8000 });
  });

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/admin`);
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('admin login and dashboard', async ({ page }) => {
    test.skip(!ADMIN_EMAIL || ADMIN_EMAIL === 'admin@kcst.edu.sd', 'Set TEST_ADMIN_EMAIL in env');
    await page.goto(`${BASE}/auth/login`);
    await page.fill('[type=email]',    ADMIN_EMAIL);
    await page.fill('[type=password]', ADMIN_PASS);
    await page.click('button[type=submit]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    await expect(page.getByText('لوحة التحكم')).toBeVisible();
  });
});
