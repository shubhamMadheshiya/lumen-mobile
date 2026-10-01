import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fixtures/test-helper';

test.describe('Insights & Reports Flows', () => {
  test('User can view Insights tab and medical disclaimer', async ({ page }) => {
    await loginAsTestUser(page);

    // Click Insights tab
    await page.getByText('Insights', { exact: true }).click();
    await expect(page).toHaveURL(/\/insights/);

    // Verify Insights header and Medical Disclaimer Banner
    await expect(page.getByText('Insights', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('About these insights')).toBeVisible();

    // Verify Export button is visible
    const exportBtn = page.getByRole('button', { name: 'Export report' });
    await expect(exportBtn).toBeVisible();
  });

  test('User can open Reports screen and configure export parameters', async ({ page }) => {
    await loginAsTestUser(page);

    // Go to Insights tab
    await page.getByText('Insights', { exact: true }).click();

    // Click Export report button
    const exportBtn = page.getByRole('button', { name: 'Export report' });
    await exportBtn.click();

    // Verify navigation to /reports
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.getByText('Date range')).toBeVisible();
    await expect(page.getByText('Format')).toBeVisible();

    // Check PDF and CSV format toggles
    await expect(page.getByText('PDF', { exact: true })).toBeVisible();
    await expect(page.getByText('CSV', { exact: true })).toBeVisible();
  });
});
