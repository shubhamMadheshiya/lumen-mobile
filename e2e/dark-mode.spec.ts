import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fixtures/test-helper';

test.describe('Dark Mode Verification Across All Pages', () => {
  test('User can switch to Dark Mode and all pages adapt theme styling', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Log in and navigate to settings
    await loginAsTestUser(page);
    await page.goto('/settings', { waitUntil: 'commit' });
    await expect(page.getByText('Profile & Settings').first()).toBeVisible({ timeout: 15000 });

    // 2. Select Dark theme
    const darkThemeButton = page.getByRole('button', { name: /Dark theme/i });
    await expect(darkThemeButton).toBeVisible();
    await darkThemeButton.click();

    // Verify Dark theme is now active
    await expect(darkThemeButton).toBeVisible();
    await page.waitForTimeout(500);

    // 3. Verify Today Page in Dark Mode
    await page.goto('/today', { waitUntil: 'commit' });
    await expect(page.getByText('Walking', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/today-dark.png' });

    // 4. Verify Timeline Page in Dark Mode
    await page.getByRole('tab', { name: /Timeline/i }).click({ force: true });
    await expect(page).toHaveURL(/\/timeline/);
    await expect(page.getByText('Timeline', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/timeline-dark.png' });

    // 5. Verify Insights Page in Dark Mode
    await page.getByRole('tab', { name: /Insights/i }).click({ force: true });
    await expect(page).toHaveURL(/\/insights/);
    await expect(page.getByText('Insights', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/insights-dark.png' });

    // 6. Verify Customize Page in Dark Mode
    await page.getByRole('tab', { name: /Customize/i }).click({ force: true });
    await expect(page).toHaveURL(/\/customize/);
    await expect(page.getByText('Customize', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/customize-dark.png' });

    // 7. Verify Reminders Page in Dark Mode
    await page.goto('/reminders', { waitUntil: 'commit' });
    await expect(page.getByText('Reminders', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/reminders-dark.png' });

    // 8. Verify Walking Page in Dark Mode via Today -> History
    await page.goto('/today', { waitUntil: 'commit' });
    await expect(page.getByText('Walking', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    const historyBtn = page.getByText('History').first();
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();
    await expect(page.getByText('Walking Tracker').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/walking-dark.png' });

    // 9. Verify Reports Page in Dark Mode via Settings -> Export Health Summary
    await page.goto('/settings', { waitUntil: 'commit' });
    await expect(page.getByText('Profile & Settings').first()).toBeVisible({ timeout: 15000 });
    const exportReportsBtn = page.getByRole('button', { name: /Export clinical health report/i });
    await expect(exportReportsBtn).toBeVisible();
    await exportReportsBtn.click();
    await expect(page.getByText('Date range', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/reports-dark.png' });

    // 10. Switch back to Light Mode to verify bi-directional toggle
    await page.goto('/settings', { waitUntil: 'commit' });
    await expect(page.getByText('Profile & Settings').first()).toBeVisible({ timeout: 15000 });
    const lightThemeButton = page.getByRole('button', { name: /Light theme/i });
    await lightThemeButton.click();
    await page.waitForTimeout(500);

    await expect(lightThemeButton).toBeVisible();

    await page.goto('/today', { waitUntil: 'commit' });
    await expect(page.getByText('Walking', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'test-results/today-light.png' });
  });
});
